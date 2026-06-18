import { URGENT_THRESHOLD_S } from "../hooks/useTaskTiming";

/** Fixed top-left countdown chip that matches the PACT timer styling. */
export const TaskTimerOverlay = ({
  secondsLeft,
  onStopEarly,
}: {
  secondsLeft: number | null;
  onStopEarly?: () => void;
}) => {
  if (secondsLeft === null) return null;
  const urgent = secondsLeft < URGENT_THRESHOLD_S;
  const total = Math.max(0, Math.ceil(secondsLeft));
  const m = Math.floor(total / 60);
  const sec = total - m * 60;
  const label = `${m}:${sec.toString().padStart(2, "0")}`;
  return (
    <>
      <div className={`pact-timer ${urgent ? "urgent" : ""}`}>⏱ {label}</div>
      {onStopEarly && (
        <div style={{ position: "fixed", top: 50, right: 20, zIndex: 40 }}>
          <button className="btn btn-warn" onClick={onStopEarly}>
            End early & save
          </button>
        </div>
      )}
    </>
  );
};
