import { useCallback, useEffect, useRef, useState } from "react";
import {
  sensors,
  isEmotiBitHrSample,
  isEmotiBitEdaSample,
  type MouseBioMetricsSample,
  type EmotiBitSample,
} from "../lib/sensors";
import type { SensorSnapshot, TaskStatus, TimingBlock } from "../lib/store";

/**
 * Shared lifecycle hook used by every task.
 *
 * Phases:
 *   - "setup"   : operator chooses timed vs non-timed + duration. Tasks that
 *                  never time-limit (AES) skip this by calling startTask() on mount.
 *   - "running" : the task UI is live; sensors are being captured; the
 *                  countdown (if timed) is ticking and turns urgent under 30 s.
 *   - "done"    : task is over; the page renders its own summary.
 *
 * Captures heart rate (mouse + EmotiBit) and EDA (EmotiBit EA stream).
 * At finalize() we compute both full-duration and last-60-second averages.
 */

export const URGENT_THRESHOLD_S = 30;
const LAST_WINDOW_S = 60;

export type TaskTimingPhase = "setup" | "running" | "done";

interface CapturedSample { value: number; unix_ms: number; }

export interface TaskTimingState {
  phase: TaskTimingPhase;
  timed: boolean;
  durationS: number;
  secondsLeft: number | null;
  isUrgent: boolean;
  setTimed: (v: boolean) => void;
  setDurationS: (v: number) => void;
  /** Called by operator from the setup screen — or directly on mount for untimed-only tasks. */
  startTask: () => void;
  /** Called by the page when the task is over. Returns the finalized record. */
  finalize: (status: TaskStatus) => {
    timing: TimingBlock;
    sensors: SensorSnapshot;
    status: TaskStatus;
    timed: boolean;
    time_limit_s: number | null;
    mouse_samples: MouseBioMetricsSample[];
    emotibit_samples: EmotiBitSample[];
  };
}

const computeAvg = (xs: number[]): number | null =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;

const sliceLast = (samples: CapturedSample[], endUnixMs: number): CapturedSample[] => {
  const cutoff = endUnixMs - LAST_WINDOW_S * 1000;
  return samples.filter((s) => s.unix_ms >= cutoff);
};

export const useTaskTiming = (defaultDurationS: number, opts?: { alwaysUntimed?: boolean }): TaskTimingState => {
  const alwaysUntimed = opts?.alwaysUntimed ?? false;
  const [phase, setPhase] = useState<TaskTimingPhase>("setup");
  const [timed, setTimedState] = useState(!alwaysUntimed);
  const [durationS, setDurationS] = useState(defaultDurationS);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const startedRef = useRef<{ iso: string; unix: number; perf: number } | null>(null);
  const deadlinePerfRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void)[]>([]);

  const mouseSamplesRef = useRef<MouseBioMetricsSample[]>([]);
  const emotiSamplesRef = useRef<EmotiBitSample[]>([]);
  // Numeric buffers (with unix_ms timestamps) so we can compute last-60s averages
  const mouseHrBufRef = useRef<CapturedSample[]>([]);
  const emotiHrBufRef = useRef<CapturedSample[]>([]);
  const emotiEdaBufRef = useRef<CapturedSample[]>([]);

  const setTimed = useCallback((v: boolean) => {
    if (alwaysUntimed) return;
    setTimedState(v);
  }, [alwaysUntimed]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    unsubRef.current.forEach((fn) => fn());
  }, []);

  const startTask = useCallback(() => {
    mouseSamplesRef.current = [];
    emotiSamplesRef.current = [];
    mouseHrBufRef.current = [];
    emotiHrBufRef.current = [];
    emotiEdaBufRef.current = [];

    startedRef.current = {
      iso: new Date().toISOString(),
      unix: Date.now(),
      perf: performance.now(),
    };

    unsubRef.current.push(
      sensors.onMouseSample((s) => {
        mouseSamplesRef.current.push(s);
        if (typeof s.heartRate === "number" && Number.isFinite(s.heartRate) && s.heartRate > 0) {
          mouseHrBufRef.current.push({ value: s.heartRate, unix_ms: s.unix_ms });
        }
      }),
      sensors.onEmotiBitSample((s) => {
        emotiSamplesRef.current.push(s);
        if (isEmotiBitHrSample(s)) {
          const v = typeof s.value === "number" ? s.value : Number(s.value);
          if (Number.isFinite(v) && v > 0) emotiHrBufRef.current.push({ value: v, unix_ms: s.unix_ms });
        } else if (isEmotiBitEdaSample(s)) {
          const v = typeof s.value === "number" ? s.value : Number(s.value);
          if (Number.isFinite(v)) emotiEdaBufRef.current.push({ value: v, unix_ms: s.unix_ms });
        }
      }),
    );

    const effectiveTimed = !alwaysUntimed && timed;
    if (effectiveTimed) {
      deadlinePerfRef.current = performance.now() + durationS * 1000;
      setSecondsLeft(durationS);
      tickRef.current = setInterval(() => {
        const left = Math.max(0, (deadlinePerfRef.current! - performance.now()) / 1000);
        setSecondsLeft(left);
      }, 200);
    } else {
      deadlinePerfRef.current = null;
      setSecondsLeft(null);
    }

    setPhase("running");
  }, [alwaysUntimed, timed, durationS]);

  const finalize = useCallback((status: TaskStatus) => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    unsubRef.current.forEach((fn) => fn());
    unsubRef.current = [];

    const started = startedRef.current ?? {
      iso: new Date().toISOString(),
      unix: Date.now(),
      perf: performance.now(),
    };
    const endIso = new Date().toISOString();
    const endUnix = Date.now();
    const timing: TimingBlock = {
      start_iso: started.iso,
      end_iso: endIso,
      start_unix_ms: started.unix,
      end_unix_ms: endUnix,
      total_ms: endUnix - started.unix,
    };

    const mouseHr = mouseHrBufRef.current;
    const emoHr = emotiHrBufRef.current;
    const emoEda = emotiEdaBufRef.current;

    const mouseHrLast = sliceLast(mouseHr, endUnix);
    const emoHrLast = sliceLast(emoHr, endUnix);
    const emoEdaLast = sliceLast(emoEda, endUnix);

    const sensorSnap: SensorSnapshot = {
      mouse_hr_avg: computeAvg(mouseHr.map((x) => x.value)),
      mouse_hr_n_samples: mouseHr.length,
      emotibit_hr_avg: computeAvg(emoHr.map((x) => x.value)),
      emotibit_hr_n_samples: emoHr.length,
      emotibit_eda_avg: computeAvg(emoEda.map((x) => x.value)),
      emotibit_eda_n_samples: emoEda.length,
      mouse_hr_avg_last60s: computeAvg(mouseHrLast.map((x) => x.value)),
      mouse_hr_n_samples_last60s: mouseHrLast.length,
      emotibit_hr_avg_last60s: computeAvg(emoHrLast.map((x) => x.value)),
      emotibit_hr_n_samples_last60s: emoHrLast.length,
      emotibit_eda_avg_last60s: computeAvg(emoEdaLast.map((x) => x.value)),
      emotibit_eda_n_samples_last60s: emoEdaLast.length,
    };

    setPhase("done");
    setSecondsLeft(null);

    return {
      timing,
      sensors: sensorSnap,
      status,
      timed: !alwaysUntimed && timed,
      time_limit_s: !alwaysUntimed && timed ? durationS : null,
      mouse_samples: mouseSamplesRef.current.slice(),
      emotibit_samples: emotiSamplesRef.current.slice(),
    };
  }, [alwaysUntimed, timed, durationS]);

  const isUrgent = secondsLeft !== null && secondsLeft < URGENT_THRESHOLD_S;

  return {
    phase,
    timed: !alwaysUntimed && timed,
    durationS,
    secondsLeft,
    isUrgent,
    setTimed,
    setDurationS,
    startTask,
    finalize,
  };
};
