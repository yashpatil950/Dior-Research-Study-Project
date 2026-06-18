import { useConnectionState } from "../hooks/useSensors";

/**
 * Renders a red banner listing whichever sensors aren't connected.
 * Returns null when both are connected. Used at the top of each
 * data-collection screen so the operator sees the problem immediately.
 */
export const ConnectionGate = ({ children }: { children?: React.ReactNode }) => {
  const state = useConnectionState();
  const missing: string[] = [];
  if (state.emotibit !== "connected") missing.push("EmotiBit");
  if (state.mouse !== "connected") missing.push("Mionix mouse");

  if (missing.length === 0) return null;

  return (
    <div className="connection-gate">
      <strong>⚠ Sensor not connected:</strong>{" "}
      {missing.join(" and ")} {missing.length === 1 ? "is" : "are"} offline. Heart-rate data
      cannot be recorded until {missing.length === 1 ? "it is" : "they are"} reconnected.
      <ul>
        {state.emotibit !== "connected" && (
          <li>
            EmotiBit: start <code>python3 emotibit_ws_bridge.py</code> and confirm the EmotiBit
            is streaming on UDP 12346.
          </li>
        )}
        {state.mouse !== "connected" && (
          <li>
            Mionix mouse: launch the Mionix Device Hub so the local
            <code> ws://localhost:7681</code> endpoint comes online.
          </li>
        )}
      </ul>
      {children}
    </div>
  );
};
