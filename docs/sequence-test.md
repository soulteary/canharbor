# Sequence communication tests

`sequence send` and `sequence receive` are bounded foreground tests using the
ordinary local service API. They do not use PCBUSB or another USB transport.
Start the service, then start the receiver and wait for its readiness message on
stderr before starting the sender in another terminal:

```sh
canharbor sequence receive --channel virtual:1 --id 123 --run-id ABCDEF01 \
  --count 100 --timeout-ms 10000
canharbor sequence send --channel virtual:0 --id 123 --run-id ABCDEF01 \
  --count 100 --interval-ms 10 --active
```

Select physical channel IDs from `canharbor devices --json`. Both ends must use
the same CAN ID, identifier width, run ID, first sequence, count, bitrates and
Classic/FD/BRS options. Use a fresh run ID for each test: it is a traffic tag,
not authentication. `--id` and `--run-id` accept hexadecimal without `0x`;
`--first` and `--count` are decimal. `--extended` selects a 29-bit identifier.
For CAN FD, add `--fd --data-bitrate 2000000` and optionally `--brs` at both ends.

Receive defaults to listen-only. On a two-node physical bus, an explicit
`sequence receive --active ...` enables controller participation including ACK;
it does not generate test data frames. A listen-only receiver cannot supply the
ACK needed by a lone transmitter. These settings do not establish that a
particular physical wiring, termination or adapter has been validated.

Each frame has exactly eight payload bytes: big-endian u32 run ID followed by
big-endian u32 sequence. Sequence starts at `--first` (default 0); wrapping is
rejected. This deliberately small protocol works in Classic and FD modes.
Random traffic generation, variable payload lengths and CRC checks are outside
this initial command.

The receiver accepts only matching RX data frames and counts unique values,
duplicates, out-of-order first arrivals, matching-tag values outside the expected
range, unrelated frames that reach its ID filter, and diagnostics. TX echoes do
not count as peer reception. Late arrivals fill holes. `missing` is the number
of expected values not observed, not a claim about where the frames were lost.
It finishes when all expected values arrive or the deadline expires; duplicates
arriving after completion are outside its observation window. A stream gap,
overflow, fault, or disconnect terminates with incomplete evidence. It never
reconnects automatically. The reported unique-frame rate uses total test elapsed
time including setup/cleanup after acquisition; it is not a calibrated bus-load
or hardware performance measurement.

Send requires `--active`. Count is 1..6000; interval is at least 10 ms, with a
requested schedule of at most 60 seconds and a hard 60-second execution deadline.
Receive timeout is 1..60000 ms. Send intervals are minimum delays after the last
response: this is a communication check, not precise periodic scheduling. Slow
requests may cause the deadline to expire before the requested count. The
service's shared per-client TX limiter and receipt/resource limits still apply.
No rejected, late, failed or uncertain submission is retried. The foreground
controller renews its existing lease every five seconds; it does not reacquire
control or resume after expiry, cancellation, restart or disconnect.

Final JSON on stdout includes counters, `passed`, `state`, error/cleanup details,
backend simulation status and elapsed time. Sender success means backend
submission only. Receiver success means the expected frames were observed in
its session, not application-level ECU delivery. Hardware verification is never
inferred from either result. Incomplete reception or integrity errors exit 6;
invalid arguments exit 2; ordinary API failures retain their existing exit codes.
An interrupted or lost in-flight TX response exits 7, retains its session,
generation and request ID, and prints a receipt lookup command. Query that
receipt; do not resend automatically. Cleanup is attempted without hiding the
original outcome. Stopping the CLI stops further test submissions; already
submitted frames cannot be recalled. Process termination without cleanup relies
on the service lease expiring and does not resume the test.

Hardware-free tests cover Classic/FD cross-channel operation, payload ordering,
range/wrap validation, duplicate/reordering/missing statistics, filtering,
explicit active mode, deadlines, cancellation, lease renewal, device faults,
failed submissions, and a proxy that discards a committed TX response while
checking that no second submission occurs and the original receipt is queryable.
