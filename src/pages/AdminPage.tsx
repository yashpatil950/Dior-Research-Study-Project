import { useEffect, useState } from "react";
import {
  loadAll,
  deleteSession,
  type ParticipantSession,
  type BaselineResult,
  type PactResult,
  type AesResult,
  type QuestionnaireResult,
  type EmailClassificationResult,
} from "../lib/store";

export const AdminPage = () => {
  const [sessions, setSessions] = useState<Record<string, ParticipantSession>>({});
  const [filter, setFilter] = useState("");

  const refresh = () => setSessions(loadAll());
  useEffect(() => { refresh(); }, []);

  const onDelete = (name: string) => {
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
        Every section of the protocol is summarized below per participant.
        Records live in this browser's local storage; the Excel files in Downloads are the canonical record.
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

      {entries.map((s) => (
        <div className="section-card" key={s.participant_name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>{s.participant_name}</h3>
            <button className="btn btn-secondary" onClick={() => onDelete(s.participant_name)}>Delete record</button>
          </div>
          <div className="hint">Created: {s.created_iso}</div>

          <BaselineSection title="Baseline (Start)" data={s.baseline_start} />
          <AesSection title="AES — Avatar version" data={s.aes_avatar} />
          <QSection title="Task 1 — Travel Request"          data={s.task1} />
          <QSection title="Task 2 — Invoice Approval"        data={s.task2} />
          <EmailSection title="Task 3 — Email Classification" data={s.task3} />
          <PactSection data={s.pact} />
          <QSection title="Task 4 — Form a"                  data={s.task4} />
          <QSection title="Task 5 — Form b"                  data={s.task5} />
          <EmailSection title="Task 6 — Email Classification" data={s.task6} />
          <AesSection title="AES — Text version"             data={s.aes_text} />
          <BaselineSection title="Baseline (End)"            data={s.baseline_end} />
        </div>
      ))}
    </div>
  );
};

const fmt = (v: number | null | undefined | string) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginTop: 12 }}>
    <h4 style={{ margin: "12px 0 4px 0" }}>{title}</h4>
    {children}
  </div>
);

const TimingRows = ({ timing }: { timing: { start_iso: string; end_iso: string; start_unix_ms: number; end_unix_ms: number; total_ms: number } }) => (
  <>
    <tr><th>Start (ISO / unix ms)</th><td>{timing.start_iso} / {timing.start_unix_ms}</td></tr>
    <tr><th>End (ISO / unix ms)</th><td>{timing.end_iso} / {timing.end_unix_ms}</td></tr>
    <tr><th>Total time</th><td>{(timing.total_ms / 1000).toFixed(2)} s <span className="hint">({timing.total_ms} ms)</span></td></tr>
  </>
);

const HrRows = ({ hr }: { hr: { emotibit_hr_avg: number | null; emotibit_hr_n_samples: number; mouse_hr_avg: number | null; mouse_hr_n_samples: number } }) => (
  <>
    <tr><th>EmotiBit avg HR</th><td>{fmt(hr.emotibit_hr_avg)} bpm <span className="hint">({hr.emotibit_hr_n_samples} samples)</span></td></tr>
    <tr><th>Mouse avg HR</th><td>{fmt(hr.mouse_hr_avg)} bpm <span className="hint">({hr.mouse_hr_n_samples} samples)</span></td></tr>
  </>
);

const BaselineSection = ({ title, data }: { title: string; data: BaselineResult | null }) => {
  if (!data) return <Section title={title}><div className="empty hint">Not recorded yet.</div></Section>;
  return (
    <Section title={title}>
      <table className="summary-table">
        <tbody>
          <tr><th>File</th><td><code>{data.file_name}</code></td></tr>
          <tr><th>Duration (planned)</th><td>{data.duration_s} s</td></tr>
          <tr><th>EmotiBit avg HR</th><td>{fmt(data.emotibit_hr_avg)} bpm <span className="hint">({data.emotibit_hr_n_samples} samples)</span></td></tr>
          <tr><th>Mouse avg HR</th><td>{fmt(data.mouse_hr_avg)} bpm <span className="hint">({data.mouse_hr_n_samples} samples)</span></td></tr>
          <TimingRows timing={data.timing} />
        </tbody>
      </table>
    </Section>
  );
};

const AesSection = ({ title, data }: { title: string; data: AesResult | null }) => {
  if (!data) return <Section title={title}><div className="empty hint">Not recorded yet.</div></Section>;
  return (
    <Section title={title}>
      <table className="summary-table">
        <tbody>
          <tr><th>File</th><td><code>{data.file_name}</code></td></tr>
          <tr><th>Timed</th><td>{data.timed ? `Yes (${data.time_limit_s} s)` : "No"}</td></tr>
          <tr><th>Status</th><td>{data.status}</td></tr>
          <tr><th>Answered</th><td>{data.n_answered} / {data.n_items}</td></tr>
          <tr><th>Total score</th><td>{data.total_score} <span className="hint">(range 18–72)</span></td></tr>
          <tr><th>Interpretation</th><td>{data.interpretation}</td></tr>
          <TimingRows timing={data.timing} />
          <HrRows hr={data.hr} />
        </tbody>
      </table>
    </Section>
  );
};

const QSection = ({ title, data }: { title: string; data: QuestionnaireResult | null }) => {
  if (!data) return <Section title={title}><div className="empty hint">Not recorded yet.</div></Section>;
  return (
    <Section title={title}>
      <table className="summary-table">
        <tbody>
          <tr><th>File</th><td><code>{data.file_name}</code></td></tr>
          <tr><th>Timed</th><td>{data.timed ? `Yes (${data.time_limit_s} s)` : "No"}</td></tr>
          <tr><th>Status</th><td>{data.status}</td></tr>
          <tr><th>Answered</th><td>{data.n_answered} / {data.n_items}</td></tr>
          <TimingRows timing={data.timing} />
          <HrRows hr={data.hr} />
        </tbody>
      </table>
    </Section>
  );
};

const EmailSection = ({ title, data }: { title: string; data: EmailClassificationResult | null }) => {
  if (!data) return <Section title={title}><div className="empty hint">Not recorded yet.</div></Section>;
  return (
    <Section title={title}>
      <table className="summary-table">
        <tbody>
          <tr><th>File</th><td><code>{data.file_name}</code></td></tr>
          <tr><th>Timed</th><td>{data.timed ? `Yes (${data.time_limit_s} s)` : "No"}</td></tr>
          <tr><th>Status</th><td>{data.status}</td></tr>
          <tr><th>Answered</th><td>{data.n_answered} / {data.n_emails}</td></tr>
          <tr><th>Correct</th><td>{data.n_correct}</td></tr>
          <tr><th>Accuracy</th><td>{data.accuracy_pct === "" ? "—" : `${data.accuracy_pct}%`}</td></tr>
          <TimingRows timing={data.timing} />
          <HrRows hr={data.hr} />
        </tbody>
      </table>
    </Section>
  );
};

const PactSection = ({ data }: { data: PactResult | null }) => {
  if (!data) return <Section title="PACT"><div className="empty hint">Not recorded yet.</div></Section>;
  return (
    <Section title="PACT">
      <table className="summary-table">
        <tbody>
          <tr><th>File</th><td><code>{data.file_name}</code></td></tr>
          <tr><th>Status</th><td>{data.status}</td></tr>
          <tr><th>Time limit</th><td>{data.time_limit_s} s</td></tr>
          <TimingRows timing={data.timing} />
          <tr><th>Initiation: planned / completed</th><td>{data.init_planned_trials} / {data.init_completed_trials}</td></tr>
          <tr><th>Init mean initiation latency</th><td>{fmt(data.init_mean_initiation_latency_ms)} ms</td></tr>
          <tr><th>Init mean movement time</th><td>{fmt(data.init_mean_movement_time_ms)} ms</td></tr>
          <tr><th>Init mean total RT</th><td>{fmt(data.init_mean_total_rt_ms)} ms</td></tr>
          <tr><th>Planning: planned / completed</th><td>{data.plan_planned_trials} / {data.plan_completed_trials}</td></tr>
          <tr><th>Plan accuracy</th><td>{fmt(data.plan_accuracy_pct)}%</td></tr>
          <tr><th>Plan mean RT (correct)</th><td>{fmt(data.plan_mean_planning_rt_ms_correct)} ms</td></tr>
          <tr><th>Plan mean movement time</th><td>{fmt(data.plan_mean_movement_time_ms)} ms</td></tr>
          <tr><th>Plan mean total RT</th><td>{fmt(data.plan_mean_total_rt_ms)} ms</td></tr>
          <tr><th>EmotiBit avg HR</th><td>{fmt(data.emotibit_hr_avg)} bpm <span className="hint">({data.emotibit_hr_n_samples} samples)</span></td></tr>
          <tr><th>Mouse avg HR</th><td>{fmt(data.mouse_hr_avg)} bpm <span className="hint">({data.mouse_hr_n_samples} samples)</span></td></tr>
        </tbody>
      </table>
    </Section>
  );
};
