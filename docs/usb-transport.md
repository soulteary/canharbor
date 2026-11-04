# nusb transport

The gs_usb library now provides explicit device discovery and USB transfers using
nusb 0.2.9. The service still registers only the virtual bus. This code is compiled
and tested without hardware; no adapter/firmware has been validated.

`usb::discover(&[VidPid { vendor, product }])` filters OS enumeration metadata
without opening devices. An empty list does not even enumerate. Every ID is an
explicit opt-in, not evidence of gs_usb compatibility. Select one returned
`Candidate` and call `open(interface, alternate)` to inspect the active
configuration, claim that interface, and select its alternate setting. The
transport rejects a non-vendor interface, missing or ambiguous bulk endpoints,
and invalid endpoint addresses/counts/sizes. It does not detach kernel drivers,
change USB configuration, or guess endpoint numbers.

`UsbTransport` implements vendor/interface control IN/OUT and bulk OUT. Bulk IN
is polled through `ReceiveTransport::read(wait)`. Only one IN transfer is queued;
a polling timeout leaves it pending. A completed transfer is delivered intact.
The protocol parser requires one complete firmware record and rejects other
layouts; transfer coalescing/fragmentation quirks require identified firmware
support, not speculative byte splicing. Throughput tuning remains pending.

Control and TX waits use 250 ms timeouts. Failed/partial transfers and short writes
are errors. A TX timeout cancels the transfer, poisons the transport, and does not
retry or claim the frame was unsent. nusb endpoint drop cancels outstanding I/O;
explicit cancellation/draining and device actor shutdown are the next increments.
Timeouts bound requested waits, not OS scheduling or an unresponsive kernel.

Synthetic configuration descriptors exercise nusb's actual descriptor parser.
Synthetic nusb completions exercise partial failures, disconnects, short writes,
and length validation. The empty-allowlist discovery test does not access USB.
Run `cargo test -p canharbor-gsusb --locked`.

nusb is MIT OR Apache-2.0; CANHarbor selects MIT for this dependency, retaining
its notice in `LICENSES/nusb-MIT.txt`. It is a Cargo dependency, not copied driver
source. Versions and platform dependencies are recorded in Cargo.lock. See the
[upstream API documentation](https://docs.rs/nusb/0.2.9/nusb/).
