import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionGate } from "../components/ConnectionGate";
import { useConnectionState } from "../hooks/useSensors";
import {
  sensors,
  isEmotiBitHrSample,
  isEmotiBitEdaSample,
  type MouseBioMetricsSample,
  type EmotiBitSample,
} from "../lib/sensors";
import {
  getCurrentParticipant,
  safeFileSegment,
  saveTaskResult,
  nextRouteAfter,
  nextLabelAfter,
  TASK_FILE_SEG,
  type BaselineResult,
  type SensorSnapshot,
} from "../lib/store";
import { writeWorkbook } from "../lib/excel";

const DURATION_S = 300; // 5 minutes
const LAST_WINDOW_MS = 60 * 1000;

type Phase = "start" | "end";
type Stage = "ready" | "recording" | "complete";

const computeAvg = (xs: number[]): number | null =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;

// EDA values are tiny (~0.1–1.0), so the 2-dp rounding used for HR (bpm) throws
// away meaningful precision. Keep full precision instead; toPrecision(12) strips
// binary-float noise (e.g. 0.170135999999) without discarding real digits.
const computeAvgPrecise = (xs: number[]): number | null =>
  xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toPrecision(12)) : null;

export const BaselinePage = ({ phase }: { phase: Phase }) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const taskKey = phase === "start" ? "baseline_start" : "baseline_end";
  const connection = useConnectionState();
  const bothConnected = connection.emotibit === "connected" && connection.mouse === "connected";

  const [stage, setStage] = useState<Stage>("ready");
  const [lastResult, setLastResult] = useState<BaselineResult | null>(null);

  const mouseBufRef = useRef<MouseBioMetricsSample[]>([]);
  const emotiBufRef = useRef<EmotiBitSample[]>([]);
  const startWallRef = useRef<{ iso: string; unix: number; perf: number } | null>(null);
  const unsubRef = useRef<(() => void)[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [liveMouseHr, setLiveMouseHr] = useState<number | null>(null);
  const [liveEmotiHr, setLiveEmotiHr] = useState<number | null>(null);
  const [liveEda, setLiveEda] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveMouseHr(sensors.latestMouse?.heartRate ?? null);
      setLiveEmotiHr(sensors.getLatestEmotiBitHr());
      const eaSample = sensors.latestEmotiBitByTag["EA"];
      setLiveEda(eaSample && typeof eaSample.value === "number" ? eaSample.value : null);
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    unsubRef.current.forEach((fn) => fn());
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  const start = () => {
    if (!bothConnected) return;
    mouseBufRef.current = [];
    emotiBufRef.current = [];
    startWallRef.current = {
      iso: new Date().toISOString(),
      unix: Date.now(),
      perf: performance.now(),
    };

    unsubRef.current.push(
      sensors.onMouseSample((s) => mouseBufRef.current.push(s)),
      sensors.onEmotiBitSample((s) => emotiBufRef.current.push(s)),
    );

    setStage("recording");

    // Fixed-duration baseline: auto-stop at DURATION_S. No on-screen countdown.
    tickRef.current = setInterval(() => {
      const elapsed = (performance.now() - startWallRef.current!.perf) / 1000;
      if (elapsed >= DURATION_S) finish();
    }, 100);
  };

  const finish = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    unsubRef.current.forEach((fn) => fn());
    unsubRef.current = [];

    const endIso = new Date().toISOString();
    const endUnix = Date.now();
    const start = startWallRef.current!;
    const cutoff = endUnix - LAST_WINDOW_MS;

    const mouseHrAll = mouseBufRef.current
      .filter((s) => typeof s.heartRate === "number" && Number.isFinite(s.heartRate!) && s.heartRate! > 0)
      .map((s) => ({ v: s.heartRate as number, t: s.unix_ms }));
    const mouseHrLast = mouseHrAll.filter((x) => x.t >= cutoff);

    const emoHrAll = emotiBufRef.current
      .filter(isEmotiBitHrSample)
      .map((s) => ({ v: typeof s.value === "number" ? s.value : Number(s.value), t: s.unix_ms }))
      .filter((x) => Number.isFinite(x.v) && x.v > 0);
    const emoHrLast = emoHrAll.filter((x) => x.t >= cutoff);

    const edaAll = emotiBufRef.current
      .filter(isEmotiBitEdaSample)
      .map((s) => ({ v: typeof s.value === "number" ? s.value : Number(s.value), t: s.unix_ms }))
      .filter((x) => Number.isFinite(x.v));
    const edaLast = edaAll.filter((x) => x.t >= cutoff);

    const snap: SensorSnapshot = {
      mouse_hr_avg: computeAvg(mouseHrAll.map((x) => x.v)),
      mouse_hr_n_samples: mouseHrAll.length,
      emotibit_hr_avg: computeAvg(emoHrAll.map((x) => x.v)),
      emotibit_hr_n_samples: emoHrAll.length,
      emotibit_eda_avg: computeAvgPrecise(edaAll.map((x) => x.v)),
      emotibit_eda_n_samples: edaAll.length,
      mouse_hr_avg_last60s: computeAvg(mouseHrLast.map((x) => x.v)),
      mouse_hr_n_samples_last60s: mouseHrLast.length,
      emotibit_hr_avg_last60s: computeAvg(emoHrLast.map((x) => x.v)),
      emotibit_hr_n_samples_last60s: emoHrLast.length,
      emotibit_eda_avg_last60s: computeAvgPrecise(edaLast.map((x) => x.v)),
      emotibit_eda_n_samples_last60s: edaLast.length,
    };

    const fileName = `${safeFileSegment(participant)}_${TASK_FILE_SEG[taskKey]}_data.xlsx`;

    const summarySheet = [{
      participant,
      phase,
      duration_s_planned: DURATION_S,
      start_iso: start.iso,
      end_iso: endIso,
      start_unix_ms: start.unix,
      end_unix_ms: endUnix,
      total_ms: endUnix - start.unix,
      mouse_hr_avg: snap.mouse_hr_avg ?? "",
      mouse_hr_n_samples: snap.mouse_hr_n_samples,
      mouse_hr_avg_last60s: snap.mouse_hr_avg_last60s ?? "",
      mouse_hr_n_samples_last60s: snap.mouse_hr_n_samples_last60s,
      emotibit_hr_avg: snap.emotibit_hr_avg ?? "",
      emotibit_hr_n_samples: snap.emotibit_hr_n_samples,
      emotibit_hr_avg_last60s: snap.emotibit_hr_avg_last60s ?? "",
      emotibit_hr_n_samples_last60s: snap.emotibit_hr_n_samples_last60s,
      emotibit_eda_avg: snap.emotibit_eda_avg ?? "",
      emotibit_eda_n_samples: snap.emotibit_eda_n_samples,
      emotibit_eda_avg_last60s: snap.emotibit_eda_avg_last60s ?? "",
      emotibit_eda_n_samples_last60s: snap.emotibit_eda_n_samples_last60s,
    }];

    writeWorkbook(fileName, {
      summary: summarySheet,
      mouse_hr: mouseBufRef.current.map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms,
        heartRate: s.heartRate ?? "", heartRateAvg: s.heartRateAvg ?? "",
        heartRateMax: s.heartRateMax ?? "", heartRateState: s.heartRateState ?? "",
        heartRateQuality: s.heartRateQuality ?? "", gsr: s.gsr ?? "",
      })),
      emotibit_hr: emotiBufRef.current.filter(isEmotiBitHrSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
      emotibit_eda: emotiBufRef.current.filter(isEmotiBitEdaSample).map((s) => ({
        ts_iso: s.ts_iso, unix_ms: s.unix_ms, stream_tag: s.stream_tag, value: s.value, reliability: s.reliability,
      })),
    });

    const result: BaselineResult = {
      phase,
      participant_name: participant,
      duration_s: DURATION_S,
      timing: {
        start_iso: start.iso,
        end_iso: endIso,
        start_unix_ms: start.unix,
        end_unix_ms: endUnix,
        total_ms: endUnix - start.unix,
      },
      sensors: snap,
      file_name: fileName,
    };
    saveTaskResult(participant, taskKey, result);
    setLastResult(result);
    setStage("complete");
  };

  const proceed = () => navigate(nextRouteAfter(participant, taskKey));
  const nextLabel = nextLabelAfter(participant, taskKey);

  return (
    <div className="screen">
      <h1>Baseline — {phase === "start" ? "Start" : "End"}</h1>
      <p>
        Resting baseline recording for <b>{DURATION_S} seconds</b> ({(DURATION_S / 60).toFixed(0)} minutes) from both sensors.
        At the end the system computes both <b>full-duration</b> and <b>last-60-second</b> averages
        for mouse HR, EmotiBit HR, and EmotiBit EDA, downloads an Excel file
        <code> {`${safeFileSegment(participant) || "<name>"}_${TASK_FILE_SEG[taskKey]}_data.xlsx`} </code>
        and updates the Admin page.
      </p>

      <ConnectionGate />

      {stage === "ready" && (
        <div className="instructions">
          <p>Ask the participant to sit still and breathe normally. When ready, click below to begin.</p>
          <button
            className="btn btn-success"
            disabled={!bothConnected}
            onClick={start}
            title={!bothConnected ? "Both sensors must be connected" : ""}
          >
            ▶ Start {(DURATION_S / 60).toFixed(0)}-minute Baseline
          </button>
          {!bothConnected && (
            <p className="error-msg">Both sensors must be connected before starting.</p>
          )}
        </div>
      )}

      {stage === "recording" && (
        <>
          <div className="metric-grid">
            <LiveCard label="EmotiBit HR" value={liveEmotiHr} unit="bpm" />
            <LiveCard label="Mouse HR" value={liveMouseHr} unit="bpm" />
            <LiveCard label="EmotiBit EDA (EA)" value={liveEda} unit="" />
            <LiveCard label="Samples captured" value={mouseBufRef.current.length + emotiBufRef.current.length} />
          </div>
          <div className="center">
            <button className="btn btn-warn" onClick={finish}>Stop early &amp; save</button>
          </div>
        </>
      )}

      {stage === "complete" && lastResult && (
        <div className="instructions">
          <h2>Recording complete</h2>
          <p>File <code>{lastResult.file_name}</code> downloaded.</p>
          <SensorSummary snap={lastResult.sensors} timing={lastResult.timing} />
          <button className="btn btn-success" onClick={proceed}>
            Continue → {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
};

const LiveCard = ({ label, value, unit }: { label: string; value: number | null; unit?: string }) => (
  <div className="metric-card">
    <div className="label">{label}</div>
    <div className="value">{value ?? "—"}{value !== null && unit ? ` ${unit}` : ""}</div>
  </div>
);

const SensorSummary = ({ snap, timing }: { snap: SensorSnapshot; timing: { start_iso: string; end_iso: string; start_unix_ms: number; end_unix_ms: number; total_ms: number } }) => (
  <table className="summary-table">
    <tbody>
      <tr><th>EmotiBit avg HR (full)</th><td>{snap.emotibit_hr_avg ?? "—"} bpm ({snap.emotibit_hr_n_samples} samples)</td></tr>
      <tr><th>EmotiBit avg HR (last 60s)</th><td>{snap.emotibit_hr_avg_last60s ?? "—"} bpm ({snap.emotibit_hr_n_samples_last60s} samples)</td></tr>
      <tr><th>Mouse avg HR (full)</th><td>{snap.mouse_hr_avg ?? "—"} bpm ({snap.mouse_hr_n_samples} samples)</td></tr>
      <tr><th>Mouse avg HR (last 60s)</th><td>{snap.mouse_hr_avg_last60s ?? "—"} bpm ({snap.mouse_hr_n_samples_last60s} samples)</td></tr>
      <tr><th>EmotiBit avg EDA (full)</th><td>{snap.emotibit_eda_avg ?? "—"} ({snap.emotibit_eda_n_samples} samples)</td></tr>
      <tr><th>EmotiBit avg EDA (last 60s)</th><td>{snap.emotibit_eda_avg_last60s ?? "—"} ({snap.emotibit_eda_n_samples_last60s} samples)</td></tr>
      <tr><th>Start / End (ISO)</th><td>{timing.start_iso} → {timing.end_iso}</td></tr>
      <tr><th>Start / End (unix ms)</th><td>{timing.start_unix_ms} → {timing.end_unix_ms}</td></tr>
      <tr><th>Total (ms)</th><td>{timing.total_ms}</td></tr>
    </tbody>
  </table>
);
