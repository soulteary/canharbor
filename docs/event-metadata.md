# Frame metadata and bus diagnostics

The stream distinguishes frame_received from bus_diagnostic. Diagnostic events
retain SocketCAN error class bits, all eight raw bytes and overflow status. They
are not ordinary CAN data and are not hidden by frame-ID/direction filters. An
overflow indication has unknown loss count; no precise dropped-frame count is
invented. Legacy core frame-only subscribers remain supported; service streams
and capture consumers use subscribe_all.

Frame events retain ESI, raw DLC, host observation time and device timestamp
metadata. Hardware timestamp mode is requested only when advertised. The gs_usb
actor records host observation before async forwarding; this is not a calibrated
USB arrival or wire timestamp. The decoder still requires the negotiated
record length, including timestamp trailers; firmware quirks need explicit support.

32-bit microsecond counters retain their raw value, including zero. Short
monotonic sequences can be extended, but no mapping to host/UTC time is claimed.
Possible wrap is marked uncertain; reset/reordering, implausible jumps or an idle
interval of at least half the counter period start another logical timestamp
epoch and retain uncertain quality until reopen. A new device open has its own
identity. Counter extension is an estimate, not proof against firmware reset.

The browser keeps a separate bounded diagnostic list and shows timestamp quality
in frame time tooltips. CLI monitor prints both event variants; --count counts
ordinary frames. A diagnostic alone cannot make a frame-count monitor succeed.

Tests cover zero, wrap/reset/idle cases, FD ESI/raw DLC propagation and diagnostic
delivery through a real Unix-socket WebSocket before a terminal bus-off message,
even when the data filter excludes every frame. All USB traffic in these tests
comes from an injected fake transport.
