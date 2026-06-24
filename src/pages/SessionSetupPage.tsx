import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentParticipant,
  getSessionOrder,
  setSessionOrder,
  REORDERABLE_TASKS,
  TASK_LABEL,
  type TaskKey,
} from "../lib/store";
import { ConnectionGate } from "../components/ConnectionGate";

/**
 * Session-Setup page. Sits between login and Baseline (Start). The operator
 * arranges the 9 middle tasks (everything between baselines) in whatever
 * order they want for this participant, then clicks Continue.
 *
 * Baseline (Start) and Baseline (End) are fixed bookends; PACT, both AES
 * variants, both Travel Cards, both Email Sortings, and both Form Entries
 * are reorderable here. AES variant ordering is naturally included — drag
 * "AES — Text version" above "AES — Avatar version" to flip the order for
 * this participant.
 */
export const SessionSetupPage = () => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const [order, setOrder] = useState<TaskKey[]>(() =>
    participant ? getSessionOrder(participant) : REORDERABLE_TASKS.slice(),
  );

  // Re-sync if the saved order changes externally.
  useEffect(() => {
    if (!participant) return;
    setOrder(getSessionOrder(participant));
  }, [participant]);

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const reset = () => setOrder(REORDERABLE_TASKS.slice());

  const save = () => {
    setSessionOrder(participant, order);
    navigate("/baseline/start");
  };

  return (
    <div className="screen">
      <h1>Session Setup</h1>
      <p>
        Arrange the order of the tasks for <b>{participant || "(no participant)"}</b>.
        Baseline (Start) is always first; Baseline (End) is always last. Everything in between
        can be reordered — including swapping AES Text vs Avatar to set which one comes first.
      </p>
      <ConnectionGate />

      <div className="instructions">
        <div className="order-row fixed-row"><span>1.</span> Baseline (Start) <span className="hint">— fixed first</span></div>
        {order.map((key, i) => (
          <div key={key} className="order-row">
            <span>{i + 2}.</span>
            <span className="order-label">{TASK_LABEL[key]}</span>
            <span className="order-controls">
              <button className="btn btn-secondary" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button className="btn btn-secondary" disabled={i === order.length - 1} onClick={() => move(i, +1)}>↓</button>
            </span>
          </div>
        ))}
        <div className="order-row fixed-row"><span>{order.length + 2}.</span> Baseline (End) <span className="hint">— fixed last</span></div>

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button className="btn btn-success" onClick={save}>Save order &amp; continue → Baseline (Start)</button>
          <button className="btn btn-secondary" onClick={reset}>Reset to default</button>
        </div>
        <p className="hint">
          The order is saved per participant. You can come back to this page anytime before
          the session begins to adjust it.
        </p>
      </div>
    </div>
  );
};
