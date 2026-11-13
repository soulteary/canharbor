# SPDX-License-Identifier: AGPL-3.0-or-later
"""Executed by the Rust ABI integration test against a virtual service.

Exits successfully without testing when python-can is not installed.
"""
import sys
import time

try:
    import can
except ImportError:
    print("skipped: python-can is not installed")
    raise SystemExit(0)

from canharbor.pythoncan import CanHarborBus

runtime, library = sys.argv[1:]
common = {"runtime_dir": runtime, "library": library}


def expect(error, call):
    try:
        call()
    except error:
        return
    raise AssertionError(f"expected {error.__name__}")


expect(can.CanInitializationError, lambda: CanHarborBus("virtual:9", **common))
expect(can.CanInitializationError, lambda: CanHarborBus("", **common))

with CanHarborBus("virtual:1", **common) as listener, \
        CanHarborBus("virtual:0", active=True, receive_own_messages=True, **common) as sender:
    assert listener.recv(timeout=0.05) is None
    # A listen-only bus refuses to send instead of changing mode.
    expect(can.CanOperationError, lambda: listener.send(can.Message(arbitration_id=1, is_extended_id=False)))
    # CAN FD needs a bus opened for it.
    expect(can.CanOperationError, lambda: sender.send(
        can.Message(arbitration_id=1, is_extended_id=False, is_fd=True, data=bytes(12))))
    sent = [
        can.Message(arbitration_id=0x123, is_extended_id=False, data=[1, 2, 3]),
        can.Message(arbitration_id=0x1ABCDEF0, is_extended_id=True, data=b""),
        can.Message(arbitration_id=0x7FF, is_extended_id=False, is_remote_frame=True, dlc=4),
    ]
    for message in sent:
        sender.send(message)
    for expected in sent:
        received = listener.recv(timeout=2.0)
        assert received is not None, expected
        assert received.is_rx and not received.is_fd and not received.is_error_frame
        assert received.arbitration_id == expected.arbitration_id
        assert received.is_extended_id == expected.is_extended_id
        assert received.is_remote_frame == expected.is_remote_frame
        assert received.dlc == expected.dlc
        assert bytes(received.data) == bytes(expected.data)
        assert received.channel == "virtual:1"
        assert received.timestamp > 0
        # The sender asked for its own transmissions and sees them marked as such.
        echoed = sender.recv(timeout=2.0)
        assert echoed is not None and not echoed.is_rx
        assert echoed.arbitration_id == expected.arbitration_id
    assert listener.recv(timeout=0.05) is None

with CanHarborBus("virtual:1", fd=True, **common) as listener, \
        CanHarborBus("virtual:0", fd=True, active=True, **common) as sender:
    sender.send(can.Message(arbitration_id=0x321, is_extended_id=False, is_fd=True,
                            bitrate_switch=True, data=bytes(range(12))))
    sender.send(can.Message(arbitration_id=0x322, is_extended_id=False, data=[9]))
    fd = listener.recv(timeout=2.0)
    assert fd is not None and fd.is_fd and fd.bitrate_switch
    assert fd.dlc == 12 and bytes(fd.data) == bytes(range(12))
    classic = listener.recv(timeout=2.0)
    assert classic is not None and not classic.is_fd and bytes(classic.data) == b"\x09"
    # Own transmissions are not delivered unless requested.
    assert sender.recv(timeout=0.2) is None
    # A payload length that is not a CAN FD wire length is rejected, not padded.
    expect(can.CanOperationError, lambda: sender.send(
        can.Message(arbitration_id=1, is_extended_id=False, is_fd=True, data=bytes(9), check=False)))

# Non-blocking polls read the stream, and control is renewed while a batch
# that is already buffered is being consumed.
with CanHarborBus("virtual:1", **common) as listener, \
        CanHarborBus("virtual:0", active=True, **common) as sender:
    for value in range(3):
        sender.send(can.Message(arbitration_id=0x200 + value, is_extended_id=False))
    polled = []
    deadline = time.monotonic() + 5
    while len(polled) < 3 and time.monotonic() < deadline:
        message = listener.recv(timeout=0)
        if message is not None:
            polled.append(message.arbitration_id)
    assert polled == [0x200, 0x201, 0x202], polled
    assert listener.recv(timeout=0) is None

    renewals = []
    renew = listener._client.renew
    listener._client.renew = lambda *args: (renewals.append(args), renew(*args))[1]
    for value in range(2):
        sender.send(can.Message(arbitration_id=0x300 + value, is_extended_id=False))
    assert listener.recv(timeout=2.0).arbitration_id == 0x300
    # Make sure the second frame is buffered before the next call.
    deadline = time.monotonic() + 5
    while not listener._pending and time.monotonic() < deadline:
        batch = listener._stream.next(timeout_ms=100)
        if batch and batch.get("type") == "events":
            listener._pending.extend(batch["events"])
    assert listener._pending
    listener._renewed -= 6  # as if the previous frame took six seconds to process
    before = len(renewals)
    assert listener.recv(timeout=2.0).arbitration_id == 0x301
    assert len(renewals) == before + 1, renewals

# Both channels are free again after the buses were shut down.
with CanHarborBus("virtual:0", **common), CanHarborBus("virtual:1", **common):
    pass
print("python-can interface checks passed")
