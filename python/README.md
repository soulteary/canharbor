# CANHarbor Python client

The Python 3.10+ package uses the standard library `ctypes` interface to
CANHarbor's version 1 C ABI. It has no runtime Python dependencies and does not
bundle a native binary. Build and select a trusted `libcanharbor_ffi` explicitly:

```sh
cargo build -p canharbor-ffi
python -m pip install ./python
```

```python
from canharbor import Client

with Client("/absolute/private/runtime/dir",
            library="/absolute/path/libcanharbor_ffi.dylib") as client:
    print(client.devices())
```

Both arguments are optional. Without a runtime directory the client uses the
same default as `canharbor serve` (`default_runtime_dir()`), so a service started
with `--runtime-dir` needs the same directory passed here. Without `library` the
path is read from the `CANHARBOR_LIBRARY` environment variable, which must also
be absolute. No search path is consulted and nothing is loaded implicitly:

```python
# CANHARBOR_LIBRARY=/absolute/path/libcanharbor_ffi.dylib
with Client() as client:
    print(client.devices())
```

`python/examples/discover.py` provides the same discovery operation from command
line arguments. `CanHarborError.status` retains the C ABI category;
`CanHarborError.response` retains API HTTP status and error detail when available.
Generation values remain decimal strings and are not converted to floating point.
The wrapper releases response handles in a `finally` block, closes its client
through a context manager or explicit `close()`, and has a best-effort finalizer.

Active operations require explicit `create(active=True)`, `acquire()` and
`start()` calls. Pass the returned generation to `renew`, `submit`, `stop` and
`release`. Callers supply and retain their own `request_id` for each logical
transmission. Reusing it is subject to the service's bounded deduplication
window; this is not a cross-restart exactly-once guarantee. There is no automatic
retry, lease renewal, background acquisition or reconnect. Stop and release
before closing: client close does not extend or implicitly release service leases.
A status-7 failure means the outcome may be unknown and must not be retried
blindly. Successful submission does not establish physical bus delivery.

The wrapper exposes JSON control. Event streaming and capture downloads use
optional native ABI extensions described below; older libraries may not provide
these operations. Tests run the Python wrapper
and example against the actual compiled shared library and a virtual service.
They cover separate identities, lease conflict, control, duplicate submission,
structured errors, nonfinite-JSON refusal, path validation and close. CI selects
Python 3.13 on Linux and macOS. No hardware, signing or notarization is verified.

The package's original source is AGPL-3.0-or-later. The full license is included
in `LICENSE`. Source and native ABI header are maintained in the CANHarbor
repository: https://github.com/soulteary/canharbor.

`client.receipt_by_request(session, request_id, generation=original_generation)`
reads an earlier result without acquiring a lease or submitting a frame. Generic
requests also accept `query={"key": "value"}`; keys and values must be strings.
Query support requires the additive ABI 1 `canharbor_request_with_query` symbol.
Older ABI 1 libraries remain usable for requests without query parameters.
A missing receipt can reflect expiry or restart and does not prove non-submission.

`client.download(capture_id, absolute_destination)` uses the additive capture
download extension. The native client streams up to 64 MiB and publishes the
file only when the declared length is received and synchronized. It refuses to
replace an existing file. The return value is `{"downloaded": True}`; recording
completeness is described by the capture's own final record. Earlier ABI 1
libraries without this extension still support ordinary JSON requests.

```python
with client.subscribe(session_id) as stream:
    message = stream.next(timeout_ms=1000)
    if message is not None:  # None means idle, not end-of-stream.
        print(message)
```

Subscriptions are read-only and do not renew the channel's control lease. The
initial message is `hello`; subsequent messages include events, gaps and faults.
They do not reconnect or resume tasks. Each stream allows one active reader;
`close()` can interrupt a waiting `next()`. Closing the parent client also stops
its streams. Handle terminal errors explicitly; a successful read is not a
promise that the stream remains connected. The native event-stream extension is
optional when loading an older ABI 1 library.

Periodic tasks use `start_periodic(session, generation, request_id=..., frame=...,
count=..., interval_ms=...)`, `periodic_tasks`, `periodic_task`, `cancel_periodic`
and read-only `periodic_by_request(..., generation=...)`. Call `renew` explicitly;
helpers never acquire control or retry. `TaskStartUnknown` preserves recovery
identifiers. Missing results do not prove nonexecution after expiry/restart.

## Complete examples

After building the native library and installing the Python package, run the
local service in another terminal. `workbench.py` uses the default runtime
directory; pass `--runtime-dir /absolute/path` when the service uses a custom one.
Use `.so` instead of `.dylib` on Linux. Replace the library path with an absolute
path to your trusted build.

```sh
python python/examples/workbench.py monitor --channel virtual:1 --seconds 10 --library /absolute/path/libcanharbor_ffi.dylib
python python/examples/workbench.py send --channel virtual:0 --active --library /absolute/path/libcanharbor_ffi.dylib
python python/examples/workbench.py periodic --channel virtual:0 --active --count 10 --interval-ms 100 --library /absolute/path/libcanharbor_ffi.dylib
```

Run the monitor and sender in separate terminals to see virtual traffic. Examples
bound observation time, renew only explicitly acquired control, print request
recovery identifiers before sending, and close controlled sessions in `finally`.
They never resubmit unknown transmissions or restart a lost task. `--active`
is required for sending. Do not use these examples on a physical bus without
reviewing their fixed ID and payload.

`client.native_features()` reports the loaded ABI major and optional query,
event-stream and capture-download extensions without opening a device. Use this
to diagnose older libraries before choosing an operation. A completed task report
still needs inspection; admission does not establish bus delivery.

Service recordings, CLI inspection and Python downloads are limited to 64 MiB.
The browser can inspect existing local recordings up to 1 GiB; that higher limit
does not raise the native download limit.

## python-can interface

With python-can installed (`pip install "./python[python-can]"`), a running
service can be used as a python-can bus:

```python
import can

# CANHARBOR_LIBRARY=/absolute/path/libcanharbor_ffi.dylib
with can.Bus(interface="canharbor", channel="virtual:0", active=True) as bus:
    bus.send(can.Message(arbitration_id=0x123, data=[1, 2], is_extended_id=False))
    print(bus.recv(timeout=1.0))
```

`channel` is a channel ID from `canharbor devices`. Other arguments: `bitrate`
(default 500000), `fd` and `data_bitrate` for CAN FD, `active`,
`receive_own_messages`, and the `runtime_dir` and `library` arguments of
`Client`.

The interface keeps the service's rules rather than python-can's usual defaults:

- A bus is listen-only unless opened with `active=True`. `send()` on a
  listen-only bus raises `CanOperationError`; it does not change the mode.
- Each bus opens one session and takes control of its channel. A channel that
  already has a session cannot be opened a second time.
- Control is renewed from `send()` and `recv()` only, with no background thread.
  A program that calls neither for about 15 seconds loses control and the
  channel stops; the next call raises `CanOperationError`. A bus that only sends
  must send, or call `recv()`, at least that often.
- A failed submission is raised and never retried. When the outcome is unknown
  the error says so and names the session and request ID for
  `receipt_by_request`.
- `send()` returns when the service accepted the frame. That is not proof of
  delivery on a physical bus. The `timeout` argument is not used.
- Timestamps are the service's monotonic clock in seconds, not wall-clock time.
- Periodic sending uses python-can's own thread-based implementation, not the
  service's periodic tasks. Filters are applied by python-can in software.
- Bus error frames and state changes are not reported as messages.

`python/tests/pythoncan.py` exercises classic, extended, remote and CAN FD
frames, own-message delivery, listen-only refusal and shutdown against a
virtual service. It is skipped when python-can is not installed. No hardware
was used.
