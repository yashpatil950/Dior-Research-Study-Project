import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectionGate } from "../components/ConnectionGate";
import { useConnectionState } from "../hooks/useSensors";
import {
  sensors,
  isEmotiBitHrSample,
  type MouseBioMetricsSample,
  type EmotiBitSample,
} from "../lib/sensors";
import {
  getCurrentParticipant,
  safeFileSegment,
  upsertBaseline,
  type BaselineResult,
} from "../lib/store";
import { writeWorkbook } from "../lib/excel";

const DURATION_S = 120;

type Phase = "start" | "end";
type Stage = "ready" | "recording" | "complete";

export const BaselinePage = ({ phase }: { phase: Phase }) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant() ?? "";
  const connection = useConnectionState();
  const bothConnected = connection.emotibit === "connected" && connection.mouse === "connected";

  const [stage, setStage] = useState<Stage>("ready");
  const [secondsLeft, setSecondsLeft] = useState(DURATION_S);
  const [lastResult, setLastResult] = useState<BaselineResult | null>(null);

  // Buffers persist across renders without triggering rerenders for every sample.
  const mouseBufRef = useRef<MouseBioMetricsSample[]>([]);
  const emotiBufRef = useRef<EmotiBitSample[]>([]);
  const startWallRef = useRef<{ iso: string; unix: number; perf: number } | null>(null);
  const unsubRef = useRef<(() => void)[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live readouts for UI (sampled at 4 Hz to avoid re-render storm).
  const [liveMouseHr, setLiveMouseHr] = useState<number | null>(null);
  const [liveEmotiHr, setLiveEmotiHr] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveMouseHr(sensors.latestMouse?.heartRate ?? null);
      setLiveEmotiHr(sensors.getLatestEmotiBitHr());
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    // cleanup if user navigates away mid-recording
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
      sensors.onEmotiBitSample((s) => {
        if (isEmotiBitHrSample(s)) emotiBufRef.current.push(s);
      }),
    );

    setStage("recording");
    setSecondsLeft(DURATION_S);

    tickRef.current = setInterval(() => {
      const elapsed = (performance.now() - startWallRef.current!.perf) / 1000;
      const left = Math.max(0, DURATION_S - elapsed);
      setSecondsLeft(left);
      if (left <= 0) finish();
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

    const mouseHrSamples = mouseBufRef.current
      .map((s) => s.heartRate)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
    const emotiHrSamples = emotiBufRef.current
      .map((s) => (typeof s.value === "number" ? s.value : Number(s.value)))
      .filter((v) => Number.isFinite(v) && v > 0);

    const avg = (xs: number[]) => xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;
    const mouseAvg = avg(mouseHrSamples);
    const emotiAvg = avg(emotiHrSamples);

    const fileName = `${safeFileSegment(participant)}_baseline_${phase}_data.xlsx`;

    const summarySheet = [{
      participant: participant,
      phase,
      duration_s_planned: DURATION_S,
      start_iso: start.iso,
      end_iso: endIso,
      start_unix_ms: start.unix,
      end_unix_ms: endUnix,
      total_ms: endUnix - start.unix,
      mouse_hr_avg: mouseAvg ?? "",
      mouse_hr_n_samples: mouseHrSamples.length,
      emotibit_hr_avg: emotiAvg ?? "",
      emotibit_hr_n_samples: emotiHrSamples.length,
    }];

    const mouseSheet = mouseBufRef.current.map((s) => ({
      ts_iso: s.ts_iso,
      unix_ms: s.unix_ms,
      heartRate: s.heartRate ?? "",
      heartRateAvg: s.heartRateAvg ?? "",
      heartRateMax: s.heartRateMax ?? "",
      heartRateState: s.heartRateState ?? "",
      heartRateQuality: s.heartRateQuality ?? "",
      gsr: s.gsr ?? "",
    }));

    const emotiSheet = emotiBufRef.current.map((s) => ({
      ts_iso: s.ts_iso,
      unix_ms: s.unix_ms,
      emotibit_time: s.emotibit_time,
      stream_tag: s.stream_tag,
      value: s.value,
      reliability: s.reliability,
    }));

    writeWorkbook(fileName, {
      summary: summarySheet,
      mouse_hr: mouseSheet,
      emotibit_hr: emotiSheet,
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
      mouse_hr_avg: mouseAvg,
      mouse_hr_n_samples: mouseHrSamples.length,
      emotibit_hr_avg: emotiAvg,
      emotibit_hr_n_samples: emotiHrSamples.length,
      file_name: fileName,
    };
    upsertBaseline(participant, phase, result);
    setLastResult(result);
    setStage("complete");
  };

  const proceed = () => {
    if (phase === "start") navigate("/aes-avatar");
    else navigate("/admin");
  };

  const isUrgent = stage === "recording" && secondsLeft < 20;

  return (
    <div className="screen">
      <h1>Baseline — {phase === "start" ? "Start" : "End"}</h1>
      <p>
        We will record the participant's resting heart rate for <b>{DURATION_S} seconds</b> from both
        sensors. At the end, an Excel file
        <code> {`${safeFileSegment(participant) || "<name>"}_baseline_${phase}_data.xlsx`} </code>
        will download automatically, and the averages will appear on the Admin page.
      </p>

      <ConnectionGate />

      {stage === "ready" && (
        <div className="instructions">
          <p>Ask the participant to sit still and breathe normally. When ready, click below to begin the 2-minute recording.</p>
          <button
            className="btn btn-success"
            disabled={!bothConnected}
            onClick={start}
            title={!bothConnected ? "Both sensors must be connected" : ""}
          >
            ▶ Start {DURATION_S}s Baseline
          </button>
          {!bothConnected && (
            <p className="error-msg">Both sensors must be connected before starting.</p>
          )}
        </div>
      )}

      {stage === "recording" && (
        <>
          <div className={`countdown ${isUrgent ? "urgent" : ""}`}>
            {Math.ceil(secondsLeft).toString().padStart(3, "0")}s
          </div>
          <div className="metric-grid">
            <LiveCard label="EmotiBit HR" value={liveEmotiHr} unit="bpm" />
            <LiveCard label="Mouse HR" value={liveMouseHr} unit="bpm" />
            <LiveCard label="EmotiBit HR samples" value={emotiBufRef.current.length} />
            <LiveCard label="Mouse samples" value={mouseBufRef.current.length} />
          </div>
          <div className="center">
            <button className="btn btn-warn" onClick={finish}>Stop early & save</button>
          </div>
        </>
      )}

      {stage === "complete" && lastResult && (
        <>
          <div className="instructions">
            <h2>Recording complete</h2>
            <p>
              File <code>{lastResult.file_name}</code> downloaded.
            </p>
            <table className="summary-table">
              <tbody>
                <tr><th>EmotiBit avg HR</th><td>{lastResult.emotibit_hr_avg ?? "—"} bpm ({lastResult.emotibit_hr_n_samples} samples)</td></tr>
                <tr><th>Mouse avg HR</th><td>{lastResult.mouse_hr_avg ?? "—"} bpm ({lastResult.mouse_hr_n_samples} samples)</td></tr>
                <tr><th>Start (ISO)</th><td>{lastResult.timing.start_iso}</td></tr>
                <tr><th>End (ISO)</th><td>{lastResult.timing.end_iso}</td></tr>
                <tr><th>Start (unix ms)</th><td>{lastResult.timing.start_unix_ms}</td></tr>
                <tr><th>End (unix ms)</th><td>{lastResult.timing.end_unix_ms}</td></tr>
                <tr><th>Total (ms)</th><td>{lastResult.timing.total_ms}</td></tr>
              </tbody>
            </table>
            <button className="btn btn-success" onClick={proceed}>
              Continue → {phase === "start" ? "AES Avatar" : "Admin"}
            </button>
          </div>
        </>
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
