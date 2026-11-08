// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
export function HardwareGuide() {
  const [backend, setBackend] = useState("gsusb");
  return (
    <details className="hardware-guide">
      <summary>Connect a hardware adapter</summary>
      <p>
        The channel list shows adapters registered by this service, not all
        plugged-in devices. Refreshing does not open USB devices. Hardware
        compatibility is unverified.
      </p>
      <label>
        Adapter backend
        <select value={backend} onChange={(e) => setBackend(e.target.value)}>
          <option value="gsusb">gs_usb (USB)</option>
          <option value="slcan">SLCAN (serial)</option>
          <option value="peak">PEAK</option>
          <option value="kvaser">Kvaser</option>
        </select>
      </label>
      {backend === "gsusb" ? (
        <>
          <p>
            1. Find your adapter's vendor/product ID, then enumerate it without
            opening a channel:
          </p>
          <pre>canharbor usb-list --vid-pid VENDOR:PRODUCT</pre>
          <p>
            2. Use the reported index, interface and alternate setting. The
            index can change after reconnecting; verify the device identity each
            time.
          </p>
          <pre>
            canharbor serve --open --usb VENDOR:PRODUCT --usb-index INDEX
            --usb-interface INTERFACE --usb-alternate ALTERNATE
          </pre>
        </>
      ) : backend === "slcan" ? (
        <>
          <p>
            Find the serial device path and firmware's serial baud rate. Choose
            the firmware dialect explicitly; serial baud is separate from CAN
            bitrate.
          </p>
          <pre>
            canharbor serve --open --slcan /dev/cu.YOUR_ADAPTER --serial-baud
            115200 --slcan-profile lawicel
          </pre>
          <p>
            For CANable FD firmware use --slcan-profile canable-fd. This
            requires a build with the slcan backend.
          </p>
        </>
      ) : (
        <>
          <p>
            Install the vendor's compatible native library for this system, then
            enumerate channels. Requires a build with the {backend} backend.
          </p>
          <pre>{`canharbor ${backend}-list --library /absolute/path/to/vendor-library\ncanharbor serve --open --${backend}-library /absolute/path/to/vendor-library --${backend}-channel HANDLE`}</pre>
        </>
      )}
      <p>
        Replace the uppercase placeholders with your device values. Stop the
        current service before starting it with new hardware options. Opening an
        adapter is an explicit action; these instructions do not execute
        commands.
      </p>
      <ul>
        <li>
          Not listed by discovery: check cable, power, device ID and OS access.
        </li>
        <li>
          Discovered but no channel here: check service startup options and
          compiled backend support.
        </li>
        <li>
          Channel listed but cannot open: inspect firmware, capability and
          library errors; registration does not prove availability.
        </li>
      </ul>
      <p>
        Read-only diagnostic export:{" "}
        <code>canharbor doctor --devices &gt; report.json</code>. Review device
        labels before sharing.
      </p>
    </details>
  );
}
