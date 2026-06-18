import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionGate } from "../components/ConnectionGate";
import { TaskSetup } from "../components/TaskSetup";
import { TaskTimerOverlay } from "../components/TaskTimerOverlay";
import { useTaskTiming } from "../hooks/useTaskTiming";
import {
  AES_CHOICES,
  AES_QUESTIONS,
  aesInterpretation,
  aesTotalScore,
  buildAesResponse,
  type AesResponse,
} from "../lib/aes";
import { getCurrentParticipant, safeFileSegment, upsertAes, type AesResult } from "../lib/store";
import { writeWorkbook } from "../lib/excel";
import { isEmotiBitHrSample } from "../lib/sensors";

export const AesTextPage = () => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const timing = useTaskTiming(600);

  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState<Array<AesResponse | null>>(
    () => Array(AES_QUESTIONS.length).fill(null),
  );
  const [finalResult, setFinalResult] = useState<AesResult | null>(null);

  useEffect(() => {
    if (timing.phase !== "running") return;
    if (timing.secondsLeft !== null && timing.secondsLeft <= 0) {
      doFinalize("time_expired");
    }
  }, [timing.phase, timing.secondsLeft]);

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
      doFinalize(timing.timed ? "completed" : "non_timed_completed");
      return;
    }
    setIdx(idx + 1);
  };

  const onPrev = () => idx > 0 && setIdx(idx - 1);

  const onStopEarly = () => {
    if (!confirm("End AES Text now and save?")) return;
    doFinalize(timing.timed ? "stopped_early" : "non_timed_completed");
  };

  const doFinalize = (status: AesResult["status"]) => {
    const f = timing.finalize(status);
    const fileName = `${safeFileSegment(participant)}_AES_Text_data.xlsx`;

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
      timed: f.timed,
      time_limit_s: f.time_limit_s ?? "",
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
      mouse_hr_avg: f.hr.mouse_hr_avg ?? "",
      mouse_hr_n_samples: f.hr.mouse_hr_n_samples,
      emotibit_hr_avg: f.hr.emotibit_hr_avg ?? "",
      emotibit_hr_n_samples: f.hr.emotibit_hr_n_samples,
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
    });

    const result: AesResult = {
      variant: "text",
      participant_name: participant,
      timed: f.timed,
      time_limit_s: f.time_limit_s,
      timing: f.timing,
      status: f.status,
      hr: f.hr,
      n_answered: nAnswered,
      n_items: AES_QUESTIONS.length,
      total_score: totalScore,
      interpretation,
      file_name: fileName,
    };
    upsertAes(participant, "text", result);
    setFinalResult(result);
  };

  if (timing.phase === "setup") {
    return (
      <TaskSetup
        title="AES — Text version"
        description={
          <p>
            18 statements about your thoughts, feelings, and activity in the past 4 weeks.
            Pick the option (NOT AT ALL → A LOT) that best describes you for each.
          </p>
        }
        defaultDurationS={600}
        timed={timing.timed}
        durationS={timing.durationS}
        onTimedChange={timing.setTimed}
        onDurationChange={timing.setDurationS}
        onStart={timing.startTask}
        startLabel="Start AES Text"
      />
    );
  }

  if (timing.phase === "done" && finalResult) {
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
              <tr><th>EmotiBit avg HR</th><td>{finalResult.hr.emotibit_hr_avg ?? "—"} bpm</td></tr>
              <tr><th>Mouse avg HR</th><td>{finalResult.hr.mouse_hr_avg ?? "—"} bpm</td></tr>
            </tbody>
          </table>
          <button className="btn btn-success" onClick={() => navigate("/baseline/end")}>
            Continue → Baseline (end)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <ConnectionGate />
      {timing.timed && (
        <TaskTimerOverlay secondsLeft={timing.secondsLeft} onStopEarly={onStopEarly} />
      )}
      <h1 className="center">AES — Text version</h1>
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
