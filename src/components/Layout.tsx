import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentParticipant,
  clearCurrentParticipant,
  REORDERABLE_TASKS,
  TASK_LABEL,
  TASK_ROUTE,
  type TaskKey,
} from "../lib/store";
import { setTestMode } from "../lib/testmode";
import { useTestMode } from "../hooks/useTestMode";
import { SensorStatusBar } from "./SensorStatus";
import { TopbarSlotHost } from "./TopbarSlot";

/** Every task, in default order, for the test-mode jump menu. */
const ALL_TASKS: TaskKey[] = ["baseline_start", ...REORDERABLE_TASKS, "baseline_end"];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant();
  const testMode = useTestMode();

  const onLogout = () => {
    if (!confirm("Sign out the current participant? Their saved session data will remain in the Admin page.")) return;
    clearCurrentParticipant();
    navigate("/");
  };

  return (
    <div className={`app${testMode ? " test-mode" : ""}`}>
      <div className="topbar">
        <span className="title">DIOR</span>
        {/* Task screens that need the full window (AES avatar) portal their
            title and controls in here via <TopbarSlot>. */}
        <TopbarSlotHost />
        <span className="nav-links">
          <Link to="/session-setup">Setup</Link>
          <Link to="/baseline/start">Baseline ▶</Link>
          <Link to="/baseline/end">Baseline ◀</Link>
          <Link to="/admin">Admin</Link>
        </span>
        {testMode && (
          <select
            className="jump-select"
            value=""
            title="Open any task directly, skipping the baseline"
            onChange={(e) => {
              const route = e.target.value;
              if (route) navigate(route);
            }}
          >
            <option value="">Jump to task…</option>
            {ALL_TASKS.map((key) => (
              <option key={key} value={TASK_ROUTE[key]}>{TASK_LABEL[key]}</option>
            ))}
          </select>
        )}
        <SensorStatusBar />
        <label
          className={`test-toggle${testMode ? " on" : ""}`}
          title="Skip the sensor checks so tasks can be opened without the mouse and EmotiBit. No data is recorded."
        >
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
          />
          Test mode
        </label>
        <span className="pid">{participant ? `Participant: ${participant}` : "Not signed in"}</span>
        {participant && (
          <button onClick={onLogout}>Sign out</button>
        )}
      </div>
      {children}
    </div>
  );
};
