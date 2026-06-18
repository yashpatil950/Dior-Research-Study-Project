import { useConnectionState } from "../hooks/useSensors";
import type { SensorStatus as Status } from "../lib/sensors";

const Pill = ({ name, status }: { name: string; status: Status }) => {
  const cls = status === "connected" ? "ok" : status === "connecting" ? "pending" : "bad";
  const label = status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : "Not connected";
  return (
    <span className={`sensor-pill ${cls}`}>
      <span className="dot" />
      {name}: {label}
    </span>
  );
};

export const SensorStatusBar = () => {
  const state = useConnectionState();
  return (
    <span style={{ display: "inline-flex", gap: 8 }}>
      <Pill name="EmotiBit" status={state.emotibit} />
      <Pill name="Mouse" status={state.mouse} />
    </span>
  );
};
