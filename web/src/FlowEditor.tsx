// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import type { StressFlow } from "./generated/api";
export function FlowEditor({
  flow,
  channels,
  onChange,
  onRemove,
}: {
  flow: StressFlow;
  channels: { id: string; label: string }[];
  onChange: (value: StressFlow) => void;
  onRemove: () => void;
}) {
  const [identifier, setIdentifier] = useState(
    Number.isInteger(flow.can_id) && flow.can_id >= 0
      ? flow.can_id.toString(16).toUpperCase()
      : "",
  );
  useEffect(() => {
    if (flow.can_id >= 0) setIdentifier(flow.can_id.toString(16).toUpperCase());
  }, [flow.can_id]);
  return (
    <fieldset aria-label={`Flow ${flow.name || "unnamed"}`}>
      <legend>{flow.name || "Unnamed flow"}</legend>
      <div className="flow-editor">
        <label>
          Flow name
          <input
            maxLength={32}
            value={flow.name ?? ""}
            onChange={(e) => onChange({ ...flow, name: e.target.value })}
          />
        </label>
        <label>
          Sender
          <select
            value={flow.sender ?? ""}
            onChange={(e) =>
              onChange({
                ...flow,
                sender: e.target.value,
                receivers: (flow.receivers ?? []).filter(
                  (id) => id !== e.target.value,
                ),
              })
            }
          >
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          ID (hex)
          <input
            value={identifier}
            aria-invalid={!/^[0-9a-f]+$/i.test(identifier)}
            onChange={(e) => {
              setIdentifier(e.target.value);
              onChange({
                ...flow,
                can_id: /^[0-9a-f]+$/i.test(e.target.value)
                  ? parseInt(e.target.value, 16)
                  : -1,
              });
            }}
          />
        </label>
        <label>
          Identifier width
          <select
            value={flow.extended ? "29" : "11"}
            onChange={(e) =>
              onChange({ ...flow, extended: e.target.value === "29" })
            }
          >
            <option value="11">11-bit</option>
            <option value="29">29-bit</option>
          </select>
        </label>
        {!flow.stages?.length && (
          <>
            <label>
              Frame count
              <input
                type="number"
                min={1}
                value={flow.count ?? 0}
                onChange={(e) =>
                  onChange({ ...flow, count: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Rate (frames/s)
              <input
                type="number"
                min={1}
                value={flow.fps ?? 0}
                onChange={(e) =>
                  onChange({ ...flow, fps: Number(e.target.value) })
                }
              />
            </label>
          </>
        )}
      </div>
      <p>Expected receivers</p>
      {channels
        .filter((c) => c.id !== flow.sender)
        .map((c) => (
          <label key={c.id} className="stress-check">
            <input
              type="checkbox"
              checked={(flow.receivers ?? []).includes(c.id)}
              onChange={(e) =>
                onChange({
                  ...flow,
                  receivers: e.target.checked
                    ? [...(flow.receivers ?? []), c.id]
                    : (flow.receivers ?? []).filter((id) => id !== c.id),
                })
              }
            />
            {c.label}
          </label>
        ))}
      {!!flow.stages?.length && (
        <p>
          This flow uses {flow.stages.length} stages. Edit their timing in
          Advanced JSON.
        </p>
      )}
      <button onClick={onRemove}>Remove flow</button>
    </fieldset>
  );
}
