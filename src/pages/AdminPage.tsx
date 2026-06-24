import { useEffect, useState } from "react";
import {
  loadAll,
  deleteSession,
  REORDERABLE_TASKS,
  TASK_LABEL,
  type ParticipantSession,
  type BaselineResult,
  type PactResult,
  type AesResult,
  type QuestionnaireResult,
  type EmailClassificationResult,
  type SensorSnapshot,
  type TaskKey,
} from "../lib/store";

type AnyResult = BaselineResult | PactResult | AesResult | QuestionnaireResult | EmailClassificationResult;

export const AdminPage = () => {
  const [sessions, setSessions] = useState<Record<string, ParticipantSession>>({});
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refresh = () => setSessions(loadAll());
  useEffect(() => { refresh(); }, []);

  const toggleExpand = (name: string) => {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const onDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete admin record for "${name}"? (Downloaded Excel files are not affected.)`)) return;
    deleteSession(name);
    refresh();
  };

  const entries = Object.values(sessions)
    .filter((s) => s.participant_name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => (a.created_iso < b.created_iso ? 1 : -1));

  return (
    <div className="screen">
      <h1>Admin — All Participants</h1>
      <p>
        Click a participant to expand their session details. Each task shows file name, status,
        timing, and full-duration + last-60-second averages for HR (mouse, EmotiBit) and EDA (EmotiBit).
      </p>
      <div className="form-row">
        <input
          placeholder="Filter by participant name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: 360 }}
        />
        <button className="btn btn-secondary" onClick={refresh} style={{ marginLeft: 8 }}>Refresh</button>
      </div>

      {entries.length === 0 && (
        <div className="instructions">
          <p className="empty">No participants recorded yet. Sign in on the login page to begin.</p>
        </div>
      )}

      {entries.map((s) => {
        const isOpen = expanded.has(s.participant_name);
        // Build the ordered list of tasks for this participant: baseline_start + their chosen order + baseline_end
        const orderedKeys: TaskKey[] = [
          "baseline_start",
          ...(s.session_order ?? REORDERABLE_TASKS),
          "baseline_end",
        ];
        const completedCount = orderedKeys.filter((k) => s.results?.[k] != null).length;

        return (
          <div className="section-card" key={s.participant_name}>
            <button
              className="participant-header"
              onClick={() => toggleExpand(s.participant_name)}
              aria-expanded={isOpen}
            >
              <span className="caret">{isOpen ? "▼" : "▶"}</span>
              <h3 style={{ flex: 1 }}>{s.participant_name}</h3>
              <span className="hint" style={{ marginRight: 16 }}>
                {completedCount} / {orderedKeys.length} sections
              </span>
              <button className="btn btn-secondary" onClick={(e) => onDelete(e, s.participant_name)}>
                Delete record
              </button>
            </button>

            {isOpen && (
              <div className="participant-body">
                <div className="hint">Created: {s.created_iso}</div>
                <div className="hint">
                  Session order: {(s.session_order ?? REORDERABLE_TASKS).map((k) => TASK_LABEL[k]).join(" → ")}
                </div>

                {orderedKeys.map((key) => (
                  <ResultSection key={key} taskKey={key} data={s.results?.[key] ?? null} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const fmt = (v: number | null | undefined | string) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

const ResultSection = ({ taskKey, data }: { taskKey: TaskKey; data: AnyResult | null }) => {
  const title = TASK_LABEL[taskKey];
  if (!data) {
    return (
      <div className="result-section">
        <h4>{title}</h4>
        <div className="empty hint">Not recorded yet.</div>
      </div>
    );
  }
  return (
    <div className="result-section">
      <h4>{title}</h4>
      <table className="summary-table">
        <tbody>
          <tr><th>File</th><td><code>{("file_name" in data) ? data.file_name : "—"}</code></td></tr>
          {taskSpecificRows(taskKey, data)}
          <TimingRows timing={data.timing} />
          <SensorRows snap={sensorsOf(data)} />
        </tbody>
      </table>
    </div>
  );
};

const sensorsOf = (data: AnyResult): SensorSnapshot => {
  if ("sensors" in data) return data.sensors;
  // shouldn't happen post-refactor, but kept for forward-compat
  return {
    mouse_hr_avg: null, mouse_hr_n_samples: 0,
    emotibit_hr_avg: null, emotibit_hr_n_samples: 0,
    emotibit_eda_avg: null, emotibit_eda_n_samples: 0,
    mouse_hr_avg_last60s: null, mouse_hr_n_samples_last60s: 0,
    emotibit_hr_avg_last60s: null, emotibit_hr_n_samples_last60s: 0,
    emotibit_eda_avg_last60s: null, emotibit_eda_n_samples_last60s: 0,
  };
};

const taskSpecificRows = (taskKey: TaskKey, data: AnyResult): React.ReactNode => {
  if (taskKey === "baseline_start" || taskKey === "baseline_end") {
    const d = data as BaselineResult;
    return <tr><th>Duration (planned)</th><td>{d.duration_s} s</td></tr>;
  }
  if (taskKey === "pact") {
    const d = data as PactResult;
    return (
      <>
        <tr><th>Status</th><td>{d.status}</td></tr>
        <tr><th>Time limit</th><td>{d.time_limit_s} s</td></tr>
        <tr><th>Initiation planned / completed</th><td>{d.init_planned_trials} / {d.init_completed_trials}</td></tr>
        <tr><th>Init mean initiation latency</th><td>{fmt(d.init_mean_initiation_latency_ms)} ms</td></tr>
        <tr><th>Init mean movement time</th><td>{fmt(d.init_mean_movement_time_ms)} ms</td></tr>
        <tr><th>Init mean total RT</th><td>{fmt(d.init_mean_total_rt_ms)} ms</td></tr>
        <tr><th>Planning planned / completed</th><td>{d.plan_planned_trials} / {d.plan_completed_trials}</td></tr>
        <tr><th>Plan accuracy</th><td>{fmt(d.plan_accuracy_pct)}%</td></tr>
        <tr><th>Plan mean RT (correct)</th><td>{fmt(d.plan_mean_planning_rt_ms_correct)} ms</td></tr>
        <tr><th>Plan mean movement time</th><td>{fmt(d.plan_mean_movement_time_ms)} ms</td></tr>
        <tr><th>Plan mean total RT</th><td>{fmt(d.plan_mean_total_rt_ms)} ms</td></tr>
      </>
    );
  }
  if (taskKey === "aes_avatar" || taskKey === "aes_text") {
    const d = data as AesResult;
    return (
      <>
        <tr><th>Status</th><td>{d.status}</td></tr>
        <tr><th>Answered</th><td>{d.n_answered} / {d.n_items}</td></tr>
        <tr><th>Total score</th><td>{d.total_score} <span className="hint">(range 18–72)</span></td></tr>
        <tr><th>Interpretation</th><td>{d.interpretation}</td></tr>
      </>
    );
  }
  if (taskKey === "email_sorting_a" || taskKey === "email_sorting_b") {
    const d = data as EmailClassificationResult;
    return (
      <>
        <tr><th>Status</th><td>{d.status}</td></tr>
        <tr><th>Timed</th><td>{d.timed ? `Yes (${d.time_limit_s} s)` : "No"}</td></tr>
        <tr><th>Answered</th><td>{d.n_answered} / {d.n_emails}</td></tr>
        <tr><th>Correct</th><td>{d.n_correct}</td></tr>
        <tr><th>Accuracy</th><td>{d.accuracy_pct === "" ? "—" : `${d.accuracy_pct}%`}</td></tr>
      </>
    );
  }
  // Form Entry / Travel Card
  const d = data as QuestionnaireResult;
  return (
    <>
      <tr><th>Status</th><td>{d.status}</td></tr>
      <tr><th>Timed</th><td>{d.timed ? `Yes (${d.time_limit_s} s)` : "No"}</td></tr>
      <tr><th>Answered</th><td>{d.n_answered} / {d.n_items}</td></tr>
    </>
  );
};

const TimingRows = ({ timing }: { timing: BaselineResult["timing"] }) => (
  <>
    <tr><th>Start (ISO / unix ms)</th><td>{timing.start_iso} / {timing.start_unix_ms}</td></tr>
    <tr><th>End (ISO / unix ms)</th><td>{timing.end_iso} / {timing.end_unix_ms}</td></tr>
    <tr><th>Total time</th><td>{(timing.total_ms / 1000).toFixed(2)} s <span className="hint">({timing.total_ms} ms)</span></td></tr>
  </>
);

const SensorRows = ({ snap }: { snap: SensorSnapshot }) => (
  <>
    <tr>
      <th>EmotiBit HR avg (full / last-60s)</th>
      <td>
        {fmt(snap.emotibit_hr_avg)} / {fmt(snap.emotibit_hr_avg_last60s)} bpm
        <span className="hint"> ({snap.emotibit_hr_n_samples} / {snap.emotibit_hr_n_samples_last60s} samples)</span>
      </td>
    </tr>
    <tr>
      <th>Mouse HR avg (full / last-60s)</th>
      <td>
        {fmt(snap.mouse_hr_avg)} / {fmt(snap.mouse_hr_avg_last60s)} bpm
        <span className="hint"> ({snap.mouse_hr_n_samples} / {snap.mouse_hr_n_samples_last60s} samples)</span>
      </td>
    </tr>
    <tr>
      <th>EmotiBit EDA avg (full / last-60s)</th>
      <td>
        {fmt(snap.emotibit_eda_avg)} / {fmt(snap.emotibit_eda_avg_last60s)}
        <span className="hint"> ({snap.emotibit_eda_n_samples} / {snap.emotibit_eda_n_samples_last60s} samples)</span>
      </td>
    </tr>
  </>
);
