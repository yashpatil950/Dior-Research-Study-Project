import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionGate } from "../components/ConnectionGate";
import { useConnectionState } from "../hooks/useSensors";
import { useGlobalKeys } from "../hooks/useGlobalKeys";
import {
  sensors,
  isEmotiBitHrSample,
  type MouseBioMetricsSample,
  type EmotiBitSample,
} from "../lib/sensors";
import {
  getCurrentParticipant,
  safeFileSegment,
  upsertPact,
  type PactResult,
} from "../lib/store";
import { writeWorkbook } from "../lib/excel";
import {
  meanOf,
  runBlock,
  type TrialRecord,
  type TrialView,
} from "../lib/pact-trial-loop";
import { PLANNING_STIMULI, INIT_STIM_FILE, PLANNING_STIM_DIR } from "../lib/pact-stimuli";

type Screen =
  | "setup"
  | "init-instructions"
  | "init-practice"
  | "init-block-start"
  | "init-block"
  | "transition"
  | "plan-instructions"
  | "plan-practice"
  | "plan-block-start"
  | "plan-block"
  | "end";

const DEFAULT_CONFIG = {
  initTrials: 30,
  initPractice: 3,
  planTrials: 30,
  planPractice: 3,
  timeLimitS: 300, // 5 minutes total for the recorded blocks combined
};

export const PactPage = () => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const connection = useConnectionState();
  const bothConnected = connection.emotibit === "connected" && connection.mouse === "connected";
  const { isHeld } = useGlobalKeys();

  const [screen, setScreen] = useState<Screen>("setup");
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Trial-loop UI state
  const [stim, setStim] = useState<TrialView>({ kind: "blank" });
  const [instructionHtml, setInstructionHtml] = useState("");
  const [progress, setProgress] = useState("");

  // Countdown timer (drives both the on-screen display and the deadline check)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Heart-rate buffers populated only during the recorded blocks
  const mouseHrBufRef = useRef<number[]>([]);
  const emotiHrBufRef = useRef<number[]>([]);
  const mouseSamplesRef = useRef<MouseBioMetricsSample[]>([]);
  const emotiSamplesRef = useRef<EmotiBitSample[]>([]);
  const hrUnsubsRef = useRef<(() => void)[]>([]);

  // Timing + trial accumulators
  const recordedStartRef = useRef<{ iso: string; unix: number } | null>(null);
  const recordedEndRef = useRef<{ iso: string; unix: number } | null>(null);
  const trialDataRef = useRef<TrialRecord[]>([]);
  const initCompletedRef = useRef(0);
  const planCompletedRef = useRef(0);

  // AbortController for the active trial-loop
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    hrUnsubsRef.current.forEach((fn) => fn());
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startHrCapture = () => {
    mouseHrBufRef.current = [];
    emotiHrBufRef.current = [];
    mouseSamplesRef.current = [];
    emotiSamplesRef.current = [];
    hrUnsubsRef.current.push(
      sensors.onMouseSample((s) => {
        mouseSamplesRef.current.push(s);
        if (typeof s.heartRate === "number" && Number.isFinite(s.heartRate) && s.heartRate > 0) {
          mouseHrBufRef.current.push(s.heartRate);
        }
      }),
      sensors.onEmotiBitSample((s) => {
        emotiSamplesRef.current.push(s);
        if (isEmotiBitHrSample(s)) {
          const v = typeof s.value === "number" ? s.value : Number(s.value);
          if (Number.isFinite(v) && v > 0) emotiHrBufRef.current.push(v);
        }
      }),
    );
  };

  const stopHrCapture = () => {
    hrUnsubsRef.current.forEach((fn) => fn());
    hrUnsubsRef.current = [];
  };

  const startCountdown = (limitS: number) => {
    deadlineRef.current = performance.now() + limitS * 1000;
    setSecondsLeft(limitS);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, (deadlineRef.current! - performance.now()) / 1000);
      setSecondsLeft(left);
    }, 200);
  };

  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    deadlineRef.current = null;
    setSecondsLeft(null);
  };

  // Preload all stimulus images on mount so timing is consistent.
  useEffect(() => {
    const all = [INIT_STIM_FILE, ...PLANNING_STIMULI.map((s) => PLANNING_STIM_DIR + s.file)];
    for (const src of all) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  // ---- Block runners ----
  const runOneBlock = async (
    subtask: "initiation" | "planning",
    isPractice: boolean,
    nTrials: number,
  ) => {
    abortRef.current = new AbortController();
    const ui = {
      setStim,
      setInstruction: setInstructionHtml,
      setProgress,
    };
    const out = await runBlock({
      participantId: participant,
      subtask,
      isPractice,
      nTrials,
      deadlineMs: isPractice ? null : deadlineRef.current,
      abortSignal: abortRef.current.signal,
      ui,
      isKeyHeld: isHeld,
      onTrial: (rec) => {
        trialDataRef.current.push(rec);
        if (!isPractice) {
          if (subtask === "initiation") initCompletedRef.current++;
          else planCompletedRef.current++;
        }
      },
    });
    return out;
  };

  // ---- Flow ----
  const onStartTask = () => {
    if (!bothConnected) return;
    trialDataRef.current = [];
    initCompletedRef.current = 0;
    planCompletedRef.current = 0;
    setScreen("init-instructions");
  };

  const onBeginInitPractice = async () => {
    setScreen("init-practice");
    setStim({ kind: "blank" });
    if (config.initPractice > 0) {
      await runOneBlock("initiation", true, config.initPractice);
    }
    setScreen("init-block-start");
  };

  const onStartInitBlock = async () => {
    // The recorded portion starts here — start HR capture + countdown timer.
    recordedStartRef.current = { iso: new Date().toISOString(), unix: Date.now() };
    startHrCapture();
    startCountdown(config.timeLimitS);
    setScreen("init-block");
    const out = await runOneBlock("initiation", false, config.initTrials);
    if (out.reason === "time_expired") return finalize("time_expired");
    if (out.reason === "aborted") return finalize("stopped_early");
    setScreen("transition");
  };

  const onStartPlanning = () => {
    setScreen("plan-instructions");
  };

  const onBeginPlanPractice = async () => {
    setScreen("plan-practice");
    if (config.planPractice > 0) {
      await runOneBlock("planning", true, config.planPractice);
    }
    setScreen("plan-block-start");
  };

  const onStartPlanBlock = async () => {
    setScreen("plan-block");
    const out = await runOneBlock("planning", false, config.planTrials);
    if (out.reason === "time_expired") return finalize("time_expired");
    if (out.reason === "aborted") return finalize("stopped_early");
    finalize("completed");
  };

  const onStopEarly = () => {
    if (!confirm("End the PACT task now and save what you have?")) return;
    abortRef.current?.abort();
  };

  const finalize = (status: PactResult["status"]) => {
    stopHrCapture();
    stopCountdown();
    recordedEndRef.current = { iso: new Date().toISOString(), unix: Date.now() };

    const initRows = trialDataRef.current.filter((r) => r.task === "initiation" && r.is_practice === 0);
    const planRows = trialDataRef.current.filter((r) => r.task === "planning" && r.is_practice === 0);
    const planCorrect = planRows.filter((r) => r.correct === 1);

    const avg = (xs: number[]) => xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;
    const mouseAvg = avg(mouseHrBufRef.current);
    const emotiAvg = avg(emotiHrBufRef.current);

    const fileName = `${safeFileSegment(participant)}_PACT_data.xlsx`;
    const start = recordedStartRef.current!;
    const end = recordedEndRef.current!;

    const planAccuracyPct: number | "" = planRows.length
      ? Math.round((planCorrect.length / planRows.length) * 10000) / 100
      : "";

    const summary = {
      participant: participant,
      time_limit_s: config.timeLimitS,
      status,
      start_iso: start.iso,
      end_iso: end.iso,
      start_unix_ms: start.unix,
      end_unix_ms: end.unix,
      total_ms: end.unix - start.unix,
      init_planned_trials: config.initTrials,
      init_completed_trials: initCompletedRef.current,
      init_mean_initiation_latency_ms: meanOf(initRows, "initiation_latency_ms"),
      init_mean_movement_time_ms: meanOf(initRows, "movement_time_ms"),
      init_mean_total_rt_ms: meanOf(initRows, "total_rt_ms"),
      plan_planned_trials: config.planTrials,
      plan_completed_trials: planCompletedRef.current,
      plan_n_correct: planCorrect.length,
      plan_accuracy_pct: planAccuracyPct,
      plan_mean_planning_rt_ms_correct: meanOf(planCorrect, "total_rt_ms"),
      plan_mean_movement_time_ms: meanOf(planRows, "movement_time_ms"),
      plan_mean_total_rt_ms: meanOf(planRows, "total_rt_ms"),
      mouse_hr_avg: mouseAvg ?? "",
      mouse_hr_n_samples: mouseHrBufRef.current.length,
      emotibit_hr_avg: emotiAvg ?? "",
      emotibit_hr_n_samples: emotiHrBufRef.current.length,
    };

    writeWorkbook(fileName, {
      summary: [summary],
      all_trials: trialDataRef.current,
      initiation_trials: trialDataRef.current.filter((r) => r.task === "initiation"),
      planning_trials: trialDataRef.current.filter((r) => r.task === "planning"),
      mouse_hr: mouseSamplesRef.current.map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, heartRate: s.heartRate ?? "", gsr: s.gsr ?? "",
      })),
      emotibit_hr: emotiSamplesRef.current.filter(isEmotiBitHrSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
    });

    const result: PactResult = {
      participant_name: participant,
      time_limit_s: config.timeLimitS,
      timing: {
        start_iso: start.iso,
        end_iso: end.iso,
        start_unix_ms: start.unix,
        end_unix_ms: end.unix,
        total_ms: end.unix - start.unix,
      },
      status,
      init_planned_trials: config.initTrials,
      init_completed_trials: initCompletedRef.current,
      init_mean_initiation_latency_ms: summary.init_mean_initiation_latency_ms,
      init_mean_movement_time_ms: summary.init_mean_movement_time_ms,
      init_mean_total_rt_ms: summary.init_mean_total_rt_ms,
      plan_planned_trials: config.planTrials,
      plan_completed_trials: planCompletedRef.current,
      plan_accuracy_pct: summary.plan_accuracy_pct,
      plan_mean_planning_rt_ms_correct: summary.plan_mean_planning_rt_ms_correct,
      plan_mean_movement_time_ms: summary.plan_mean_movement_time_ms,
      plan_mean_total_rt_ms: summary.plan_mean_total_rt_ms,
      mouse_hr_avg: mouseAvg,
      mouse_hr_n_samples: mouseHrBufRef.current.length,
      emotibit_hr_avg: emotiAvg,
      emotibit_hr_n_samples: emotiHrBufRef.current.length,
      file_name: fileName,
    };
    upsertPact(participant, result);
    setScreen("end");
  };

  // ---- Renders ----
  if (screen === "setup") {
    return (
      <div className="screen">
        <h1>PACT — Setup</h1>
        <ConnectionGate />
        <div className="instructions">
          <p>Configure the recorded blocks. Practice runs use the same trials but aren't counted.</p>
          <NumRow label="# Initiation trials" value={config.initTrials} onChange={(v) => setConfig((c) => ({ ...c, initTrials: v }))} />
          <NumRow label="# Initiation practice" value={config.initPractice} onChange={(v) => setConfig((c) => ({ ...c, initPractice: v }))} />
          <NumRow label="# Planning trials" value={config.planTrials} onChange={(v) => setConfig((c) => ({ ...c, planTrials: v }))} />
          <NumRow label="# Planning practice" value={config.planPractice} onChange={(v) => setConfig((c) => ({ ...c, planPractice: v }))} />
          <NumRow label="Time limit (seconds, total recorded)" value={config.timeLimitS} onChange={(v) => setConfig((c) => ({ ...c, timeLimitS: v }))} />
          <p className="hint">
            The timer counts down only during the <b>recorded</b> Initiation and Planning blocks
            (practice is untimed). It turns red under 20 s; reaching 0 ends the task early.
          </p>
          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn-success"
              disabled={!bothConnected}
              onClick={onStartTask}
              title={!bothConnected ? "Both sensors must be connected" : ""}
            >
              Begin PACT
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "init-instructions") {
    return (
      <div className="screen">
        <h1>Subtask 1 — Initiation</h1>
        <div className="instructions">
          <ul>
            <li>Hold <span className="key">SPACE</span> with one finger.</li>
            <li>When a triangle appears, release <span className="key">SPACE</span> and press <span className="key">ENTER</span> as fast as you can.</li>
            <li>Then hold SPACE again for the next trial.</li>
          </ul>
          <button className="btn btn-success" onClick={onBeginInitPractice}>Begin Practice</button>
        </div>
      </div>
    );
  }

  if (screen === "init-block-start") {
    return (
      <div className="screen">
        <h1>Practice Complete</h1>
        <div className="instructions">
          <p>The recorded Initiation block is next. The countdown timer begins as soon as you click below.</p>
          <button className="btn btn-success" onClick={onStartInitBlock}>Start Initiation Block</button>
        </div>
      </div>
    );
  }

  if (screen === "transition") {
    return (
      <div className="screen">
        <h1 className="center">Initiation Complete</h1>
        <div className="instructions">
          <p className="center">When you are ready, click below to begin Subtask 2 (Planning).</p>
          <div className="center"><button className="btn btn-success" onClick={onStartPlanning}>Continue → Planning</button></div>
        </div>
      </div>
    );
  }

  if (screen === "plan-instructions") {
    return (
      <div className="screen">
        <h1>Subtask 2 — Planning</h1>
        <div className="instructions">
          <ul>
            <li>Hold <span className="key">SPACE</span>.</li>
            <li>When a shape appears, decide LEFT or RIGHT:
              <ul>
                <li><b style={{ color: "#1d6fb8" }}>LEFT</b> if blue OR horizontal stripes.</li>
                <li><b style={{ color: "#d96a17" }}>RIGHT</b> if orange OR vertical stripes.</li>
              </ul>
            </li>
            <li>Release SPACE, then press <span className="key">←</span> or <span className="key">→</span>.</li>
          </ul>
          <button className="btn btn-success" onClick={onBeginPlanPractice}>Begin Practice</button>
        </div>
      </div>
    );
  }

  if (screen === "plan-block-start") {
    return (
      <div className="screen">
        <h1>Practice Complete</h1>
        <div className="instructions">
          <p>The recorded Planning block is next. The countdown timer continues.</p>
          <button className="btn btn-success" onClick={onStartPlanBlock}>Start Planning Block</button>
        </div>
      </div>
    );
  }

  if (screen === "end") {
    return (
      <div className="screen">
        <h1>PACT Complete</h1>
        <div className="instructions">
          <p>Data downloaded as <code>{safeFileSegment(participant)}_PACT_data.xlsx</code>.</p>
          <button className="btn btn-success" onClick={() => navigate("/task/4")}>
            Continue → Task 4
          </button>
        </div>
      </div>
    );
  }

  // ---- Trial screens ----
  const showRule = screen === "plan-practice" || screen === "plan-block";
  const showTimer = screen === "init-block" || screen === "plan-block";
  const urgent = showTimer && secondsLeft !== null && secondsLeft < 20;

  return (
    <div className="trial-screen">
      {showRule && (
        <div className="rule-bar">
          <span className="left-rule"><b>LEFT</b> = Blue OR Horizontal stripes</span>
          <span className="right-rule"><b>RIGHT</b> = Orange OR Vertical stripes</span>
        </div>
      )}
      {showTimer && secondsLeft !== null && (
        <div className={`pact-timer ${urgent ? "urgent" : ""}`}>
          ⏱ {formatMinSec(secondsLeft)}
        </div>
      )}
      <div className="trial-progress">{progress}</div>

      <div className="stim-area">
        {stim.kind === "image" && <img src={stim.src} alt="stim" />}
        {stim.kind === "false_start" && (
          <div className="big-message" style={{ color: "#c0392b" }}>
            Too early!<br />Wait for the stimulus before releasing.
          </div>
        )}
        {stim.kind === "feedback" && (
          <div className={`feedback ${stim.correct === true ? "correct" : stim.correct === false ? "incorrect" : ""}`}>
            {stim.correct === true ? "Correct" : stim.correct === false ? "Incorrect" : "—"}
            <div style={{ fontSize: 18, fontWeight: 400, color: "#555", marginTop: 12 }}>
              RT: {Math.round(stim.rt_ms)} ms
            </div>
          </div>
        )}
      </div>

      <div
        className="trial-instruction"
        dangerouslySetInnerHTML={{ __html: instructionHtml }}
      />
      {showTimer && (
        <div style={{ position: "fixed", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
          <button className="btn btn-warn" onClick={onStopEarly}>End early & save</button>
        </div>
      )}
    </div>
  );
};

const NumRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="form-row">
    <label>{label}</label>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (Number.isFinite(n) && n >= 0) onChange(n);
      }}
    />
  </div>
);

const formatMinSec = (s: number): string => {
  const total = Math.max(0, Math.ceil(s));
  const m = Math.floor(total / 60);
  const sec = total - m * 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
