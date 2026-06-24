import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentParticipant,
  safeFileSegment,
  saveTaskResult,
  nextRouteAfter,
  nextLabelAfter,
  TASK_FILE_SEG,
  TASK_LABEL,
  type QuestionnaireResult,
  type TaskKey,
} from "../lib/store";
import { useTaskTiming } from "../hooks/useTaskTiming";
import { TaskSetup } from "../components/TaskSetup";
import { TaskTimerOverlay } from "../components/TaskTimerOverlay";
import { ConnectionGate } from "../components/ConnectionGate";
import { Questionnaire, countAnswered, answerToCell, type Answers, type Question } from "../components/Questionnaire";
import { writeWorkbook } from "../lib/excel";
import { isEmotiBitHrSample, isEmotiBitEdaSample } from "../lib/sensors";

interface Props {
  taskKey: TaskKey;
  description: React.ReactNode;
  storyCard?: React.ReactNode;
  questions: Question[];
  defaultDurationS: number;
}

export const QuestionnaireTaskPage = ({
  taskKey,
  description,
  storyCard,
  questions,
  defaultDurationS,
}: Props) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const timing = useTaskTiming(defaultDurationS);
  const [answers, setAnswers] = useState<Answers>({});
  const [finalResult, setFinalResult] = useState<QuestionnaireResult | null>(null);

  const onChange = (id: string, value: Answers[string]) =>
    setAnswers((cur) => ({ ...cur, [id]: value }));

  useEffect(() => {
    if (timing.phase !== "running") return;
    if (timing.secondsLeft !== null && timing.secondsLeft <= 0) {
      doFinalize("time_expired");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timing.phase, timing.secondsLeft]);

  const doFinalize = (status: "completed" | "stopped_early" | "time_expired" | "non_timed_completed") => {
    const f = timing.finalize(status);
    const fileName = `${safeFileSegment(participant)}_${TASK_FILE_SEG[taskKey]}_data.xlsx`;

    const answerRows = questions.map((q, i) => ({
      n: i + 1,
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      response: answerToCell(answers[q.id] ?? null),
    }));

    const summary = {
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
      n_items: questions.length,
      n_answered: countAnswered(questions, answers),
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
      emotibit_eda: f.emotibit_samples.filter(isEmotiBitEdaSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
    });

    const result: QuestionnaireResult = {
      task_key: taskKey,
      task_label: TASK_LABEL[taskKey],
      participant_name: participant,
      timed: f.timed,
      time_limit_s: f.time_limit_s,
      timing: f.timing,
      status: f.status,
      sensors: f.sensors,
      n_answered: summary.n_answered,
      n_items: questions.length,
      file_name: fileName,
    };
    saveTaskResult(participant, taskKey, result);
    setFinalResult(result);
  };

  if (timing.phase === "setup") {
    return (
      <TaskSetup
        title={TASK_LABEL[taskKey]}
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
        <h1>{TASK_LABEL[taskKey]}</h1>
        <ConnectionGate />
        {timing.timed && (
          <TaskTimerOverlay
            secondsLeft={timing.secondsLeft}
            totalSeconds={timing.durationS}
            onStopEarly={onStopEarly}
          />
        )}
        {storyCard}
        <Questionnaire questions={questions} answers={answers} onChange={onChange} />
        <div className="center" style={{ margin: "20px 0 40px" }}>
          <button className="btn btn-success" onClick={onSubmit}>Submit &amp; Save</button>
          {!timing.timed && (
            <button className="btn btn-secondary" onClick={onStopEarly} style={{ marginLeft: 8 }}>
              End early
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>{TASK_LABEL[taskKey]} — Complete</h1>
      <div className="instructions">
        {finalResult && (
          <>
            <p>Data downloaded as <code>{finalResult.file_name}</code>.</p>
            <table className="summary-table">
              <tbody>
                <tr><th>Status</th><td>{finalResult.status}</td></tr>
                <tr><th>Answered</th><td>{finalResult.n_answered} / {finalResult.n_items}</td></tr>
                <tr><th>Total time</th><td>{(finalResult.timing.total_ms / 1000).toFixed(1)} s</td></tr>
                <tr><th>EmotiBit avg HR (full / last-60s)</th><td>{finalResult.sensors.emotibit_hr_avg ?? "—"} / {finalResult.sensors.emotibit_hr_avg_last60s ?? "—"} bpm</td></tr>
                <tr><th>Mouse avg HR (full / last-60s)</th><td>{finalResult.sensors.mouse_hr_avg ?? "—"} / {finalResult.sensors.mouse_hr_avg_last60s ?? "—"} bpm</td></tr>
                <tr><th>EmotiBit avg EDA (full / last-60s)</th><td>{finalResult.sensors.emotibit_eda_avg ?? "—"} / {finalResult.sensors.emotibit_eda_avg_last60s ?? "—"}</td></tr>
              </tbody>
            </table>
          </>
        )}
        <button className="btn btn-success" onClick={() => navigate(nextRouteAfter(participant, taskKey))}>
          Continue → {nextLabelAfter(participant, taskKey)}
        </button>
      </div>
    </div>
  );
};
