import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionGate } from "../components/ConnectionGate";
import { TaskSetup } from "../components/TaskSetup";
import { TaskTimerOverlay } from "../components/TaskTimerOverlay";
import { useTaskTiming } from "../hooks/useTaskTiming";
import { EmailMockup, type MockEmail } from "../components/EmailMockup";
import {
  getCurrentParticipant,
  safeFileSegment,
  saveTaskResult,
  nextRouteAfter,
  nextLabelAfter,
  TASK_FILE_SEG,
  TASK_LABEL,
  type EmailClassificationResult,
  type TaskKey,
} from "../lib/store";
import { writeWorkbook } from "../lib/excel";
import { isEmotiBitHrSample, isEmotiBitEdaSample } from "../lib/sensors";

const CATEGORIES: MockEmail["category"][] = ["Update", "Question/Request", "Advertisement/Spam"];

interface Choice {
  emailId: string;
  selected: MockEmail["category"] | null;
  correct: MockEmail["category"];
  ts_iso: string | null;
}

export const EmailClassifyPage = ({
  taskKey,
  emails,
}: {
  taskKey: TaskKey;
  emails: MockEmail[];
}) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const timing = useTaskTiming(600);

  const [idx, setIdx] = useState(0);
  const [choices, setChoices] = useState<Choice[]>(
    () => emails.map((e) => ({ emailId: e.id, selected: null, correct: e.category, ts_iso: null })),
  );
  const [finalResult, setFinalResult] = useState<EmailClassificationResult | null>(null);

  useEffect(() => {
    if (timing.phase !== "running") return;
    if (timing.secondsLeft !== null && timing.secondsLeft <= 0) {
      doFinalize("time_expired");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timing.phase, timing.secondsLeft]);

  const onPick = (cat: MockEmail["category"]) => {
    setChoices((cur) => {
      const next = cur.slice();
      next[idx] = { ...next[idx], selected: cat, ts_iso: new Date().toISOString() };
      return next;
    });
  };

  const onNext = () => {
    if (!choices[idx].selected) {
      alert("Please pick a category before continuing.");
      return;
    }
    if (idx === emails.length - 1) {
      doFinalize(timing.timed ? "completed" : "non_timed_completed");
      return;
    }
    setIdx(idx + 1);
  };

  const onPrev = () => idx > 0 && setIdx(idx - 1);

  const onStopEarly = () => {
    if (!confirm(`End ${TASK_LABEL[taskKey]} now and save?`)) return;
    doFinalize(timing.timed ? "stopped_early" : "non_timed_completed");
  };

  const doFinalize = (status: EmailClassificationResult["status"]) => {
    const f = timing.finalize(status);
    const fileName = `${safeFileSegment(participant)}_${TASK_FILE_SEG[taskKey]}_data.xlsx`;

    const nAnswered = choices.filter((c) => c.selected !== null).length;
    const nCorrect = choices.filter((c) => c.selected === c.correct).length;
    const acc: number | "" = nAnswered ? Math.round((nCorrect / nAnswered) * 10000) / 100 : "";

    const responseRows = choices.map((c, i) => {
      const e = emails[i];
      return {
        n: i + 1,
        email_id: e.id,
        subject: e.subject,
        sender: e.sender_name,
        correct_category: c.correct,
        chosen_category: c.selected ?? "",
        correct: c.selected ? (c.selected === c.correct ? 1 : 0) : "",
        ts_iso: c.ts_iso ?? "",
      };
    });

    const summary = [{
      participant,
      task_key: taskKey,
      task_label: TASK_LABEL[taskKey],
      timed: f.timed,
      time_limit_s: f.time_limit_s ?? "",
      status: f.status,
      start_iso: f.timing.start_iso,
      end_iso: f.timing.end_iso,
      start_unix_ms: f.timing.start_unix_ms,
      end_unix_ms: f.timing.end_unix_ms,
      total_ms: f.timing.total_ms,
      n_emails: emails.length,
      n_answered: nAnswered,
      n_correct: nCorrect,
      accuracy_pct: acc,
      mouse_hr_avg: f.sensors.mouse_hr_avg ?? "",
      mouse_hr_n_samples: f.sensors.mouse_hr_n_samples,
      mouse_hr_avg_last60s: f.sensors.mouse_hr_avg_last60s ?? "",
      mouse_hr_n_samples_last60s: f.sensors.mouse_hr_n_samples_last60s,
      emotibit_hr_avg: f.sensors.emotibit_hr_avg ?? "",
      emotibit_hr_n_samples: f.sensors.emotibit_hr_n_samples,
      emotibit_hr_avg_last60s: f.sensors.emotibit_hr_avg_last60s ?? "",
      emotibit_hr_n_samples_last60s: f.sensors.emotibit_hr_n_samples_last60s,
      emotibit_eda_avg: f.sensors.emotibit_eda_avg ?? "",
      emotibit_eda_n_samples: f.sensors.emotibit_eda_n_samples,
      emotibit_eda_avg_last60s: f.sensors.emotibit_eda_avg_last60s ?? "",
      emotibit_eda_n_samples_last60s: f.sensors.emotibit_eda_n_samples_last60s,
    }];

    writeWorkbook(fileName, {
      summary,
      responses: responseRows,
      mouse_hr: f.mouse_samples.map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, heartRate: s.heartRate ?? "", gsr: s.gsr ?? "",
      })),
      emotibit_hr: f.emotibit_samples.filter(isEmotiBitHrSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
      emotibit_eda: f.emotibit_samples.filter(isEmotiBitEdaSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
    });

    const result: EmailClassificationResult = {
      task_key: taskKey,
      participant_name: participant,
      timed: f.timed,
      time_limit_s: f.time_limit_s,
      timing: f.timing,
      status: f.status,
      sensors: f.sensors,
      n_emails: emails.length,
      n_answered: nAnswered,
      n_correct: nCorrect,
      accuracy_pct: acc,
      file_name: fileName,
    };
    saveTaskResult(participant, taskKey, result);
    setFinalResult(result);
  };

  if (timing.phase === "setup") {
    return (
      <TaskSetup
        title={TASK_LABEL[taskKey]}
        description={
          <p>
            You'll see {emails.length} emails one at a time. For each, decide whether it's an{" "}
            <b>Update</b>, a <b>Question / Request</b>, or <b>Advertisement / Spam</b>,
            then click <b>Next</b>.
          </p>
        }
        defaultDurationS={600}
        timed={timing.timed}
        durationS={timing.durationS}
        onTimedChange={timing.setTimed}
        onDurationChange={timing.setDurationS}
        onStart={timing.startTask}
        startLabel={`Start ${TASK_LABEL[taskKey]}`}
      />
    );
  }

  if (timing.phase === "done" && finalResult) {
    return (
      <div className="screen">
        <h1>{TASK_LABEL[taskKey]} — Complete</h1>
        <div className="instructions">
          <p>Data downloaded as <code>{finalResult.file_name}</code>.</p>
          <table className="summary-table">
            <tbody>
              <tr><th>Status</th><td>{finalResult.status}</td></tr>
              <tr><th>Answered</th><td>{finalResult.n_answered} / {finalResult.n_emails}</td></tr>
              <tr><th>Correct</th><td>{finalResult.n_correct}</td></tr>
              <tr><th>Accuracy</th><td>{finalResult.accuracy_pct === "" ? "—" : `${finalResult.accuracy_pct}%`}</td></tr>
              <tr><th>Total time</th><td>{(finalResult.timing.total_ms / 1000).toFixed(1)} s</td></tr>
              <tr><th>EmotiBit HR (full / last-60s)</th><td>{finalResult.sensors.emotibit_hr_avg ?? "—"} / {finalResult.sensors.emotibit_hr_avg_last60s ?? "—"} bpm</td></tr>
              <tr><th>Mouse HR (full / last-60s)</th><td>{finalResult.sensors.mouse_hr_avg ?? "—"} / {finalResult.sensors.mouse_hr_avg_last60s ?? "—"} bpm</td></tr>
              <tr><th>EmotiBit EDA (full / last-60s)</th><td>{finalResult.sensors.emotibit_eda_avg ?? "—"} / {finalResult.sensors.emotibit_eda_avg_last60s ?? "—"}</td></tr>
            </tbody>
          </table>
          <button className="btn btn-success" onClick={() => navigate(nextRouteAfter(participant, taskKey))}>
            Continue → {nextLabelAfter(participant, taskKey)}
          </button>
        </div>
      </div>
    );
  }

  const current = emails[idx];
  const chosen = choices[idx].selected;

  return (
    <div className="screen">
      <ConnectionGate />
      {timing.timed && (
        <TaskTimerOverlay
          secondsLeft={timing.secondsLeft}
          totalSeconds={timing.durationS}
          onStopEarly={onStopEarly}
        />
      )}
      <h1 className="center">{TASK_LABEL[taskKey]} — Email {idx + 1} of {emails.length}</h1>
      <div className="classify-progress">
        Decide whether this email is an <b>Update</b>, a <b>Question / Request</b>, or <b>Advertisement / Spam</b>.
      </div>

      <EmailMockup email={current} />

      <div className="classify-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`classify-btn ${chosen === cat ? "selected" : ""}`}
            onClick={() => onPick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="aes-nav-row">
        <button className="btn btn-secondary" disabled={idx === 0} onClick={onPrev}>Previous</button>
        <button className="btn btn-success" disabled={!chosen} onClick={onNext}>
          {idx === emails.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
};

// ---- Thin wrappers per task ----
import { TASK3_EMAILS, TASK6_EMAILS } from "../lib/task-emails";

export const EmailSortingAPage = () => (
  <EmailClassifyPage taskKey="email_sorting_a" emails={TASK3_EMAILS} />
);

export const EmailSortingBPage = () => (
  <EmailClassifyPage taskKey="email_sorting_b" emails={TASK6_EMAILS} />
);
