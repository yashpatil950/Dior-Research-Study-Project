import { useCallback, useEffect, useRef, useState } from "react";
import {
  sensors,
  isEmotiBitHrSample,
  type MouseBioMetricsSample,
  type EmotiBitSample,
} from "../lib/sensors";
import type { HrSnapshot, TaskStatus, TimingBlock } from "../lib/store";

/**
 * Shared lifecycle hook used by every new task.
 *
 * Phases:
 *   - "setup"   : operator chooses timed vs non-timed + duration
 *   - "running" : the task UI is live; HR is being captured; the countdown
 *                  (if timed) is ticking and turns urgent under 15 s
 *   - "done"    : task is over; the page renders its own summary
 *
 * The task page is expected to render whatever it needs during "running"
 * and call `finalize(status, extraTiming?)` when finished. The hook
 * returns timing + HR snapshots so the page can stitch them into its
 * Excel and admin record.
 */

export const URGENT_THRESHOLD_S = 15;

export type TaskTimingPhase = "setup" | "running" | "done";

export interface TaskTimingState {
  phase: TaskTimingPhase;
  timed: boolean;
  durationS: number;
  secondsLeft: number | null;
  isUrgent: boolean;
  setTimed: (v: boolean) => void;
  setDurationS: (v: number) => void;
  /** Called by operator from the setup screen. */
  startTask: () => void;
  /** Called by the page when the task is over. Returns the finalized record. */
  finalize: (status: TaskStatus) => {
    timing: TimingBlock;
    hr: HrSnapshot;
    status: TaskStatus;
    timed: boolean;
    time_limit_s: number | null;
    mouse_samples: MouseBioMetricsSample[];
    emotibit_samples: EmotiBitSample[];
  };
}

export const useTaskTiming = (defaultDurationS: number): TaskTimingState => {
  const [phase, setPhase] = useState<TaskTimingPhase>("setup");
  const [timed, setTimed] = useState(true);
  const [durationS, setDurationS] = useState(defaultDurationS);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const startedRef = useRef<{ iso: string; unix: number; perf: number } | null>(null);
  const deadlinePerfRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void)[]>([]);

  const mouseSamplesRef = useRef<MouseBioMetricsSample[]>([]);
  const emotiSamplesRef = useRef<EmotiBitSample[]>([]);
  const mouseHrBufRef = useRef<number[]>([]);
  const emotiHrBufRef = useRef<number[]>([]);

  // Cleanup on unmount.
  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    unsubRef.current.forEach((fn) => fn());
  }, []);

  const startTask = useCallback(() => {
    mouseSamplesRef.current = [];
    emotiSamplesRef.current = [];
    mouseHrBufRef.current = [];
    emotiHrBufRef.current = [];

    startedRef.current = {
      iso: new Date().toISOString(),
      unix: Date.now(),
      perf: performance.now(),
    };

    unsubRef.current.push(
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

    if (timed) {
      deadlinePerfRef.current = performance.now() + durationS * 1000;
      setSecondsLeft(durationS);
      tickRef.current = setInterval(() => {
        const left = Math.max(0, (deadlinePerfRef.current! - performance.now()) / 1000);
        setSecondsLeft(left);
        // The page is responsible for noticing left===0 and calling finalize("time_expired").
      }, 200);
    } else {
      deadlinePerfRef.current = null;
      setSecondsLeft(null);
    }

    setPhase("running");
  }, [timed, durationS]);

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

    const avg = (xs: number[]) =>
      xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;

    const hr: HrSnapshot = {
      mouse_hr_avg: avg(mouseHrBufRef.current),
      mouse_hr_n_samples: mouseHrBufRef.current.length,
      emotibit_hr_avg: avg(emotiHrBufRef.current),
      emotibit_hr_n_samples: emotiHrBufRef.current.length,
    };

    setPhase("done");
    setSecondsLeft(null);

    return {
      timing,
      hr,
      status,
      timed,
      time_limit_s: timed ? durationS : null,
      mouse_samples: mouseSamplesRef.current.slice(),
      emotibit_samples: emotiSamplesRef.current.slice(),
    };
  }, [timed, durationS]);

  const isUrgent = secondsLeft !== null && secondsLeft < URGENT_THRESHOLD_S;

  return {
    phase,
    timed,
    durationS,
    secondsLeft,
    isUrgent,
    setTimed,
    setDurationS,
    startTask,
    finalize,
  };
};
