# Explicit hardware service access

The CLI can compose the virtual bus with one explicitly selected gs_usb device.
No USB device is opened by default. Enumeration alone sends no gs_usb commands:

```sh
canharbor usb-list --vid-pid 1d50:606f
canharbor serve --usb 1d50:606f --usb-index 0 --usb-interface 0 --usb-alternate 0
```

These IDs and interface settings are illustrative, not a compatibility claim.
The index is valid only for that enumeration and is not a persistent identity.
Interface opening runs outside the async executor. Each open gets a fresh UUID;
reconnecting does not resume control or transmission. Multiple device composition
uses the core Registry, which rejects duplicate channel IDs.

The authenticated device API reports backend, simulation status and verification
status. Hardware channels are marked hardware_unverified. The UI shows hardware
access and accepts nominal/FD data bitrates; unsupported configurations are
rejected by the driver. Classic and FD monitor/session commands accept --fd and
--data-bitrate; send uses the same options. Without --fd a physical channel is
configured for Classic CAN. Virtual channels use the same explicit FD-mode selection, with their fixed
nominal/data rates.

Hardware TX receipts report backend_submitted, not virtual acceptance or bus
acknowledgement. Firmware echoes are observations and do not prove ECU delivery.
Only the virtual path has browser end-to-end evidence. A fake USB transport tests
the authenticated HTTP-to-runtime-to-actor path, metadata, receipts and cleanup.
Actual adapter/firmware, hotplug and sleep/wake acceptance remain unverified.

Capability queries, revision-guarded configuration, timestamp/diagnostic streams,
TX receipt querying and shutdown diagnostics are implemented. See
[channel configuration](channel-configuration.md), [device diagnostics](device-diagnostics.md)
and [transmission receipts](transmission-receipts.md). These interfaces report
backend declarations and observations; no physical CAN network was accessed during development.

## Host prerequisites on Linux

These notes follow from how the backends open devices. They have not been
exercised with a physical adapter.

**USB device access.** The gs_usb backend opens the USB device node directly, so
the account running `canharbor serve` needs read/write access to it. On most
distributions the node is writable by root only and opening fails with an access
error. A udev rule can grant access to the locally logged-in user for one
explicit vendor:product pair. Replace the illustrative IDs with those reported
by `canharbor usb-list`:

```text
# /etc/udev/rules.d/70-canharbor.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="1d50", ATTR{idProduct}=="606f", TAG+="uaccess"
```

Reload with `sudo udevadm control --reload-rules`, then reconnect the adapter.
Running the service as root is not a substitute and is not recommended.

**Kernel gs_usb driver.** The Linux kernel includes a `gs_usb` driver that binds
matching adapters and exposes them as SocketCAN interfaces. CANHarbor does not
detach kernel drivers, so claiming the interface fails while that driver holds
it. Releasing the interface is a host administration step that CANHarbor does
not perform, for example by writing the interface's bus ID to
`/sys/bus/usb/drivers/gs_usb/unbind`. While released, the adapter is not
available through SocketCAN, and it is bound again on reconnect.

**Serial devices.** The SLCAN backend opens the given serial device path. The
account needs access to that device, which usually means membership in the group
that owns it (`dialout` on Debian-based systems, `uucp` on some others). Group
changes apply to new login sessions.

The workbench's **Connect a hardware adapter** guide explains discovery and
explicit startup options for each backend. Its list contains registered service
channels, not every attached USB device. Discovery commands and diagnostic export
are read-only; running a generated startup command explicitly opens the selected adapter.
