import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionGate } from "../components/ConnectionGate";
import { useConnectionState } from "../hooks/useSensors";
import { useTaskTiming } from "../hooks/useTaskTiming";
import {
  AES_CHOICES,
  AES_QUESTIONS,
  aesInterpretation,
  aesTotalScore,
  buildAesResponse,
  type AesResponse,
} from "../lib/aes";
import {
  getCurrentParticipant,
  safeFileSegment,
  saveTaskResult,
  nextRouteAfter,
  nextLabelAfter,
  TASK_FILE_SEG,
  TASK_LABEL,
  type AesResult,
} from "../lib/store";
import { writeWorkbook } from "../lib/excel";
import { isEmotiBitHrSample, isEmotiBitEdaSample } from "../lib/sensors";

export const AesTextPage = () => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const connection = useConnectionState();
  const bothConnected = connection.emotibit === "connected" && connection.mouse === "connected";
  // AES is *always* untimed.
  const timing = useTaskTiming(0, { alwaysUntimed: true });

  const [stage, setStage] = useState<"ready" | "running" | "finished">("ready");
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState<Array<AesResponse | null>>(
    () => Array(AES_QUESTIONS.length).fill(null),
  );
  const [finalResult, setFinalResult] = useState<AesResult | null>(null);

  const onBegin = () => {
    if (!bothConnected) return;
    setStage("running");
    timing.startTask();
  };

  const selectAnswer = (choiceIndex: number) => {
    setResponses((cur) => {
      const next = cur.slice();
      next[idx] = buildAesResponse(idx + 1, choiceIndex);
      return next;
    });
  };

  const onNext = () => {
    if (!responses[idx]) {
      alert("Please choose an option before continuing.");
      return;
    }
    if (idx === AES_QUESTIONS.length - 1) {
      doFinalize("non_timed_completed");
      return;
    }
    setIdx(idx + 1);
  };

  const onPrev = () => idx > 0 && setIdx(idx - 1);

  const onStopEarly = () => {
    if (!confirm("End AES Text now and save?")) return;
    doFinalize("stopped_early");
  };

  const doFinalize = (status: AesResult["status"]) => {
    const f = timing.finalize(status);
    const fileName = `${safeFileSegment(participant)}_${TASK_FILE_SEG.aes_text}_data.xlsx`;

    const nAnswered = responses.filter((r) => r !== null).length;
    const totalScore = aesTotalScore(responses);
    const interpretation = aesInterpretation(totalScore, nAnswered);

    const responseRows = responses.map((r, i) => ({
      n: i + 1,
      prompt: AES_QUESTIONS[i],
      response: r ? r.choiceLabel : "",
      raw_score: r ? r.rawScore : "",
      final_score: r ? r.finalScore : "",
      scoring_type: r ? r.scoringType : "",
      ts_iso: r ? r.ts_iso : "",
    }));

    const summary = [{
      participant,
      variant: "text",
      status: f.status,
      start_iso: f.timing.start_iso,
      end_iso: f.timing.end_iso,
      start_unix_ms: f.timing.start_unix_ms,
      end_unix_ms: f.timing.end_unix_ms,
      total_ms: f.timing.total_ms,
      n_answered: nAnswered,
      n_items: AES_QUESTIONS.length,
      total_score: totalScore,
      possible_range: "18–72",
      apathy_threshold: 42,
      interpretation,
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

    const result: AesResult = {
      variant: "text",
      participant_name: participant,
      timing: f.timing,
      status: f.status,
      sensors: f.sensors,
      n_answered: nAnswered,
      n_items: AES_QUESTIONS.length,
      total_score: totalScore,
      interpretation,
      file_name: fileName,
    };
    saveTaskResult(participant, "aes_text", result);
    setFinalResult(result);
    setStage("finished");
  };

  if (stage === "ready") {
    return (
      <div className="screen">
        <h1>{TASK_LABEL.aes_text}</h1>
        <ConnectionGate />
        <div className="instructions">
          <p>
            18 statements about your thoughts, feelings, and activity in the past 4 weeks.
            Pick the option (NOT AT ALL → A LOT) that best describes you for each.
            This task is <b>untimed</b>.
          </p>
          <button
            className="btn btn-success"
            disabled={!bothConnected}
            onClick={onBegin}
            title={!bothConnected ? "Both sensors must be connected" : ""}
          >
            ▶ Start AES Text
          </button>
          {!bothConnected && (
            <p className="error-msg">Both sensors must be connected before starting.</p>
          )}
        </div>
      </div>
    );
  }

  if (stage === "finished" && finalResult) {
    return (
      <div className="screen">
        <h1>AES Text Complete</h1>
        <div className="instructions">
          <p>Data downloaded as <code>{finalResult.file_name}</code>.</p>
          <table className="summary-table">
            <tbody>
              <tr><th>Status</th><td>{finalResult.status}</td></tr>
              <tr><th>Answered</th><td>{finalResult.n_answered} / {finalResult.n_items}</td></tr>
              <tr><th>Total score</th><td>{finalResult.total_score}</td></tr>
              <tr><th>Interpretation</th><td>{finalResult.interpretation}</td></tr>
              <tr><th>Total time</th><td>{(finalResult.timing.total_ms / 1000).toFixed(1)} s</td></tr>
              <tr><th>EmotiBit HR (full / last-60s)</th><td>{finalResult.sensors.emotibit_hr_avg ?? "—"} / {finalResult.sensors.emotibit_hr_avg_last60s ?? "—"} bpm</td></tr>
              <tr><th>Mouse HR (full / last-60s)</th><td>{finalResult.sensors.mouse_hr_avg ?? "—"} / {finalResult.sensors.mouse_hr_avg_last60s ?? "—"} bpm</td></tr>
              <tr><th>EmotiBit EDA (full / last-60s)</th><td>{finalResult.sensors.emotibit_eda_avg ?? "—"} / {finalResult.sensors.emotibit_eda_avg_last60s ?? "—"}</td></tr>
            </tbody>
          </table>
          <button className="btn btn-success" onClick={() => navigate(nextRouteAfter(participant, "aes_text"))}>
            Continue → {nextLabelAfter(participant, "aes_text")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <ConnectionGate />
      <div style={{ position: "fixed", top: 80, right: 20 }}>
        <button className="btn btn-warn" onClick={onStopEarly}>End early &amp; save</button>
      </div>
      <h1 className="center">{TASK_LABEL.aes_text}</h1>
      <div className="aes-progress">Question {idx + 1} of {AES_QUESTIONS.length}</div>

      <div className="aes-text-prompt">{AES_QUESTIONS[idx]}</div>

      <div className="aes-opts">
        {AES_CHOICES.map((c, i) => {
          const selected = responses[idx]?.choiceIndex === i;
          return (
            <button
              key={c.label}
              className={`aes-opt ${selected ? "selected" : ""}`}
              onClick={() => selectAnswer(i)}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="aes-nav-row">
        <button className="btn btn-secondary" disabled={idx === 0} onClick={onPrev}>Previous</button>
        <button className="btn btn-success" disabled={!responses[idx]} onClick={onNext}>
          {idx === AES_QUESTIONS.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
};
