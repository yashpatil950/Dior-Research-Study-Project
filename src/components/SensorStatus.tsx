import { useConnectionState } from "../hooks/useSensors";
import type { SensorStatus as Status } from "../lib/sensors";

const Pill = ({ name, status }: { name: string; status: Status }) => {
  const cls = status === "connected" ? "ok" : status === "connecting" ? "pending" : "bad";
  const label = status === "connected" ? "Connected" : status === "connecting" ? "Connecting…" : "Not connected";
  return (
    <span className={`sensor-pill ${cls}`}>
      <span className="dot" />
      {/* One flex item, so the pill's gap doesn't open up before the colon.
          The status half is dropped by CSS when the top bar is tight. */}
      <span>{name}<span className="sensor-pill-status">: {label}</span></span>
    </span>
  );
};

export const SensorStatusBar = () => {
  const state = useConnectionState();
  return (
    <span className="sensor-bar">
      <Pill name="EmotiBit" status={state.emotibit} />
      <Pill name="Mouse" status={state.mouse} />
    </span>
  );
};
