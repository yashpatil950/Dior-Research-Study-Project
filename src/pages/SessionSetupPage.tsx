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
 * order they want for this participant — either by clicking ↑/↓ on each row
 * or by grabbing the ⋮⋮ handle and dragging the row to its new position.
 *
 * Baseline (Start) and Baseline (End) are fixed bookends; PACT, both AES
 * variants, both Travel Cards, both Email Sortings, and both Form Entries
 * are reorderable here. Drag "AES — Text version" above "AES — Avatar version"
 * to flip the order for this participant.
 */
export const SessionSetupPage = () => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const [order, setOrder] = useState<TaskKey[]>(() =>
    participant ? getSessionOrder(participant) : REORDERABLE_TASKS.slice(),
  );

  // Drag-and-drop state
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

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

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    const next = order.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };

  const reset = () => setOrder(REORDERABLE_TASKS.slice());

  const save = () => {
    setSessionOrder(participant, order);
    navigate("/baseline/start");
  };

  // ---- Drag handlers ----
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, i: number) => {
    setDragSrc(i);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers need data in the transfer to actually drag.
    e.dataTransfer.setData("text/plain", String(i));
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, i: number) => {
    if (dragSrc === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== i) setDragOver(i);
  };

  const onDragLeave = (i: number) => {
    if (dragOver === i) setDragOver(null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, i: number) => {
    e.preventDefault();
    if (dragSrc !== null && dragSrc !== i) reorder(dragSrc, i);
    setDragSrc(null);
    setDragOver(null);
  };

  const onDragEnd = () => {
    setDragSrc(null);
    setDragOver(null);
  };

  return (
    <div className="screen">
      <h1>Session Setup</h1>
      <p>
        Arrange the order of the tasks for <b>{participant || "(no participant)"}</b>.
        Baseline (Start) is always first; Baseline (End) is always last. Everything in between
        can be reordered — either with the ↑/↓ buttons or by grabbing <span className="grip">⋮⋮</span>
        and dragging the row.
      </p>
      <ConnectionGate />

      <div className="instructions">
        <div className="order-row fixed-row">
          <span>1.</span> Baseline (Start) <span className="hint">— fixed first</span>
        </div>

        {order.map((key, i) => {
          const classes = [
            "order-row",
            "draggable",
            dragSrc === i ? "dragging" : "",
            dragOver === i && dragSrc !== null && dragSrc !== i ? "drop-target" : "",
          ].filter(Boolean).join(" ");
          return (
            <div
              key={key}
              className={classes}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragLeave={() => onDragLeave(i)}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={onDragEnd}
            >
              <span className="grip" title="Drag to reorder">⋮⋮</span>
              <span>{i + 2}.</span>
              <span className="order-label">{TASK_LABEL[key]}</span>
              <span className="order-controls">
                <button className="btn btn-secondary" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">↑</button>
                <button className="btn btn-secondary" disabled={i === order.length - 1} onClick={() => move(i, +1)} title="Move down">↓</button>
              </span>
            </div>
          );
        })}

        <div className="order-row fixed-row">
          <span>{order.length + 2}.</span> Baseline (End) <span className="hint">— fixed last</span>
        </div>

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
