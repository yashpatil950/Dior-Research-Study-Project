import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentParticipant, safeFileSegment, upsertQuestionnaire, type QuestionnaireResult } from "../lib/store";
import { useTaskTiming } from "../hooks/useTaskTiming";
import { TaskSetup } from "../components/TaskSetup";
import { TaskTimerOverlay } from "../components/TaskTimerOverlay";
import { ConnectionGate } from "../components/ConnectionGate";
import { Questionnaire, countAnswered, answerToCell, type Answers, type Question } from "../components/Questionnaire";
import { writeWorkbook } from "../lib/excel";
import { isEmotiBitHrSample } from "../lib/sensors";

interface Props {
  taskId: 1 | 2 | 4 | 5;
  label: string;
  description: React.ReactNode;
  /** Optional story-card content rendered above the questions during running phase. */
  storyCard?: React.ReactNode;
  questions: Question[];
  defaultDurationS: number;
  /** Where to go after the Continue → Next button on the completion screen. */
  nextRoute: string;
  nextRouteLabel: string;
}

export const QuestionnaireTaskPage = ({
  taskId,
  label,
  description,
  storyCard,
  questions,
  defaultDurationS,
  nextRoute,
  nextRouteLabel,
}: Props) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const timing = useTaskTiming(defaultDurationS);
  const [answers, setAnswers] = useState<Answers>({});
  const [finalResult, setFinalResult] = useState<QuestionnaireResult | null>(null);

  const onChange = (id: string, value: Answers[string]) =>
    setAnswers((cur) => ({ ...cur, [id]: value }));

  // Auto-finalize when the deadline passes.
  useEffect(() => {
    if (timing.phase !== "running") return;
    if (timing.secondsLeft !== null && timing.secondsLeft <= 0) {
      doFinalize("time_expired");
    }
    // We re-run on every tick of secondsLeft, which is fine — the guard
    // ensures doFinalize only runs once before phase moves to "done".
  }, [timing.phase, timing.secondsLeft]);

  const doFinalize = (status: "completed" | "stopped_early" | "time_expired" | "non_timed_completed") => {
    const f = timing.finalize(status);
    const fileName = `${safeFileSegment(participant)}_Task${taskId}_data.xlsx`;

    const answerRows = questions.map((q, i) => ({
      n: i + 1,
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      response: answerToCell(answers[q.id] ?? null),
    }));

    const summary = {
      participant,
      task_id: taskId,
      task_label: label,
      timed: f.timed,
      time_limit_s: f.time_limit_s ?? "",
      status: f.status,
      start_iso: f.timing.start_iso,
      end_iso: f.timing.end_iso,
      start_unix_ms: f.timing.start_unix_ms,
      end_unix_ms: f.timing.end_unix_ms,
      total_ms: f.timing.total_ms,
      n_items: questions.length,
      n_answered: countAnswered(questions, answers),
      mouse_hr_avg: f.hr.mouse_hr_avg ?? "",
      mouse_hr_n_samples: f.hr.mouse_hr_n_samples,
      emotibit_hr_avg: f.hr.emotibit_hr_avg ?? "",
      emotibit_hr_n_samples: f.hr.emotibit_hr_n_samples,
    };

    writeWorkbook(fileName, {
      summary: [summary],
      responses: answerRows,
      mouse_hr: f.mouse_samples.map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, heartRate: s.heartRate ?? "", gsr: s.gsr ?? "",
      })),
      emotibit_hr: f.emotibit_samples.filter(isEmotiBitHrSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
    });

    const result: QuestionnaireResult = {
      task_id: taskId,
      task_label: label,
      participant_name: participant,
      timed: f.timed,
      time_limit_s: f.time_limit_s,
      timing: f.timing,
      status: f.status,
      hr: f.hr,
      n_answered: summary.n_answered,
      n_items: questions.length,
      file_name: fileName,
    };
    upsertQuestionnaire(participant, taskId, result);
    setFinalResult(result);
  };

  if (timing.phase === "setup") {
    return (
      <TaskSetup
        title={`Task ${taskId} — ${label}`}
        description={description}
        defaultDurationS={defaultDurationS}
        timed={timing.timed}
        durationS={timing.durationS}
        onTimedChange={timing.setTimed}
        onDurationChange={timing.setDurationS}
        onStart={timing.startTask}
      />
    );
  }

  if (timing.phase === "running") {
    const onStopEarly = () => {
      if (!confirm("End the task now and save what you have?")) return;
      doFinalize(timing.timed ? "stopped_early" : "non_timed_completed");
    };
    const onSubmit = () => {
      doFinalize(timing.timed ? "completed" : "non_timed_completed");
    };
    return (
      <div className="screen">
        <h1>Task {taskId} — {label}</h1>
        <ConnectionGate />
        {timing.timed && (
          <TaskTimerOverlay secondsLeft={timing.secondsLeft} onStopEarly={onStopEarly} />
        )}
        {storyCard}
        <Questionnaire questions={questions} answers={answers} onChange={onChange} />
        <div className="center" style={{ margin: "20px 0 40px" }}>
          <button className="btn btn-success" onClick={onSubmit}>Submit & Save</button>
          {!timing.timed && (
            <button className="btn btn-secondary" onClick={onStopEarly} style={{ marginLeft: 8 }}>
              End early
            </button>
          )}
        </div>
      </div>
    );
  }

  // "done"
  return (
    <div className="screen">
      <h1>Task {taskId} Complete</h1>
      <div className="instructions">
        {finalResult && (
          <>
            <p>Data downloaded as <code>{finalResult.file_name}</code>.</p>
            <table className="summary-table">
              <tbody>
                <tr><th>Status</th><td>{finalResult.status}</td></tr>
                <tr><th>Answered</th><td>{finalResult.n_answered} / {finalResult.n_items}</td></tr>
                <tr><th>Total time</th><td>{(finalResult.timing.total_ms / 1000).toFixed(1)} s</td></tr>
                <tr><th>EmotiBit avg HR</th><td>{finalResult.hr.emotibit_hr_avg ?? "—"} bpm ({finalResult.hr.emotibit_hr_n_samples} samples)</td></tr>
                <tr><th>Mouse avg HR</th><td>{finalResult.hr.mouse_hr_avg ?? "—"} bpm ({finalResult.hr.mouse_hr_n_samples} samples)</td></tr>
              </tbody>
            </table>
          </>
        )}
        <button className="btn btn-success" onClick={() => navigate(nextRoute)}>
          Continue → {nextRouteLabel}
        </button>
      </div>
    </div>
  );
};
