import { ConnectionGate } from "./ConnectionGate";
import { useCanStartTask } from "../hooks/useSensors";

/**
 * Pre-task screen used by every new task: pick timed vs non-timed +
 * a duration, then click Start. Renders the standard sensor gate at top
 * so the operator sees if either sensor is offline.
 */
export const TaskSetup = ({
  title,
  description,
  defaultDurationS,
  timed,
  durationS,
  onTimedChange,
  onDurationChange,
  onStart,
  startLabel = "Begin Task",
}: {
  title: string;
  description: React.ReactNode;
  defaultDurationS: number;
  timed: boolean;
  durationS: number;
  onTimedChange: (v: boolean) => void;
  onDurationChange: (v: number) => void;
  onStart: () => void;
  startLabel?: string;
}) => {
  const canStart = useCanStartTask();

  return (
    <div className="screen">
      <h1>{title}</h1>
      <ConnectionGate />
      <div className="instructions">
        {description}

        <div className="form-row" style={{ marginTop: 24 }}>
          <label>This will be:</label>
          <span>
            <label style={{ marginRight: 18, fontWeight: 500 }}>
              <input
                type="radio"
                checked={timed}
                onChange={() => onTimedChange(true)}
                style={{ marginRight: 6 }}
              />
              Timed
            </label>
            <label style={{ fontWeight: 500 }}>
              <input
                type="radio"
                checked={!timed}
                onChange={() => onTimedChange(false)}
                style={{ marginRight: 6 }}
              />
              Non-timed
            </label>
          </span>
        </div>

        {timed && (
          <div className="form-row">
            <label htmlFor="dur">Time allowed (seconds):</label>
            <input
              id="dur"
              type="number"
              min={5}
              max={3600}
              value={durationS}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n) && n > 0) onDurationChange(n);
              }}
            />
            <span className="hint" style={{ marginLeft: 12 }}>
              default {defaultDurationS}s • timer turns red under 15 s
            </span>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            className="btn btn-success"
            disabled={!canStart}
            onClick={onStart}
            title={!canStart ? "Both sensors must be connected (or turn on Test mode)" : ""}
          >
            ▶ {startLabel}
          </button>
          {!canStart && (
            <span className="error-msg" style={{ marginLeft: 12 }}>
              Connect both sensors before starting.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
