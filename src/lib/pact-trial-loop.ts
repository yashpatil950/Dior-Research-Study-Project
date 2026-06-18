/**
 * PACT trial loop, ported from pact_task.html with two additions:
 *   1. A global deadline (ms since performance.timeOrigin) that causes the
 *      block to end early when crossed — drives the on-screen timer.
 *   2. UI updates are dispatched as actions instead of innerHTML pokes.
 */

import { INIT_STIM_FILE, PLANNING_STIM_DIR, buildPlanningStimList, type PlanningStim } from "./pact-stimuli";

export interface TrialRecord {
  participant_id: string;
  task: "initiation" | "planning";
  is_practice: 0 | 1;
  trial_index: number;
  timestamp_iso: string;
  foreperiod_ms: number;
  stimulus_file: string;
  stim_color: string;
  stim_stripes: string;
  correct_response: "" | "LEFT" | "RIGHT";
  response: "" | "LEFT" | "RIGHT";
  response_key: string;
  correct: "" | 0 | 1;
  stimulus_onset_ms: number;
  start_key_down_ms: number;
  start_key_release_ms: number;
  response_key_press_ms: number;
  initiation_latency_ms: number;
  movement_time_ms: number;
  total_rt_ms: number;
  planning_rt_ms_correct: number | "";
}

export type TrialView =
  | { kind: "blank" }
  | { kind: "image"; src: string }
  | { kind: "false_start" }
  | { kind: "feedback"; correct: boolean | null; rt_ms: number };

export interface TrialUI {
  setStim: (v: TrialView) => void;
  setInstruction: (html: string) => void;
  setProgress: (text: string) => void;
}

export interface RunBlockArgs {
  participantId: string;
  subtask: "initiation" | "planning";
  isPractice: boolean;
  nTrials: number;
  /** performance.now() value past which no new trial should start. null = no limit. */
  deadlineMs: number | null;
  /** Aborts on End-Session click. */
  abortSignal: AbortSignal;
  ui: TrialUI;
  /** Returns key state so trial logic can check whether SPACE is already held. */
  isKeyHeld: (code: string) => boolean;
  /** Called after every completed trial. */
  onTrial: (rec: TrialRecord) => void;
}

const FOREPERIOD_MIN_MS = 500;
const FOREPERIOD_MAX_MS = 1200;
const FEEDBACK_MS_PRACTICE = 1100;
const ITI_MS = 600;
const FALSE_START_MSG_MS = 1400;

const round2 = (x: number): number => Math.round(x * 100) / 100;

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    };
    signal.addEventListener("abort", onAbort);
  });

const waitForKeyDown = (code: string, signal: AbortSignal): Promise<number> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const handler = (e: KeyboardEvent) => {
      if (e.code === code) {
        cleanup();
        resolve(performance.now());
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new Error("aborted"));
    };
    const cleanup = () => {
      document.removeEventListener("keydown", handler);
      signal.removeEventListener("abort", onAbort);
    };
    document.addEventListener("keydown", handler);
    signal.addEventListener("abort", onAbort);
  });

const waitForAnyKeyDown = (
  codes: string[],
  signal: AbortSignal,
): Promise<{ key: string; time: number }> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const handler = (e: KeyboardEvent) => {
      if (codes.includes(e.code)) {
        cleanup();
        resolve({ key: e.code, time: performance.now() });
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new Error("aborted"));
    };
    const cleanup = () => {
      document.removeEventListener("keydown", handler);
      signal.removeEventListener("abort", onAbort);
    };
    document.addEventListener("keydown", handler);
    signal.addEventListener("abort", onAbort);
  });

const waitForKeyUp = (code: string, signal: AbortSignal): Promise<number> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const handler = (e: KeyboardEvent) => {
      if (e.code === code) {
        cleanup();
        resolve(performance.now());
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new Error("aborted"));
    };
    const cleanup = () => {
      document.removeEventListener("keyup", handler);
      signal.removeEventListener("abort", onAbort);
    };
    document.addEventListener("keyup", handler);
    signal.addEventListener("abort", onAbort);
  });

const waitForReleaseOrTimeout = (
  code: string,
  ms: number,
  signal: AbortSignal,
): Promise<{ releasedEarly: boolean; time: number }> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: KeyboardEvent) => {
      if (e.code === code) {
        cleanup();
        resolve({ releasedEarly: true, time: performance.now() });
      }
    };
    const onAbort = () => {
      cleanup();
      reject(new Error("aborted"));
    };
    const cleanup = () => {
      document.removeEventListener("keyup", handler);
      signal.removeEventListener("abort", onAbort);
      clearTimeout(timer);
    };
    document.addEventListener("keyup", handler);
    signal.addEventListener("abort", onAbort);
    timer = setTimeout(() => {
      cleanup();
      resolve({ releasedEarly: false, time: performance.now() });
    }, ms);
  });

const waitUntilKeyHeld = async (
  code: string,
  signal: AbortSignal,
  isKeyHeld: (code: string) => boolean,
): Promise<number> => {
  if (isKeyHeld(code)) return performance.now();
  return waitForKeyDown(code, signal);
};

const deadlinePassed = (deadlineMs: number | null): boolean =>
  deadlineMs !== null && performance.now() >= deadlineMs;

export interface BlockOutcome {
  completedTrials: number;
  reason: "completed" | "aborted" | "time_expired";
}

export const runBlock = async (args: RunBlockArgs): Promise<BlockOutcome> => {
  const { subtask, isPractice, nTrials, deadlineMs, abortSignal, ui, isKeyHeld, onTrial, participantId } = args;

  const planList = subtask === "planning" ? buildPlanningStimList(nTrials) : null;
  let completed = 0;

  for (let i = 0; i < nTrials; i++) {
    if (abortSignal.aborted) return { completedTrials: completed, reason: "aborted" };
    if (deadlinePassed(deadlineMs)) return { completedTrials: completed, reason: "time_expired" };

    ui.setProgress(`${isPractice ? "Practice " : ""}Trial ${i + 1} / ${nTrials}`);
    const stim = planList ? planList[i] : null;
    let rec: TrialRecord | null = null;
    try {
      rec = await runOneTrial(participantId, subtask, isPractice, i + 1, stim, deadlineMs, abortSignal, ui, isKeyHeld);
    } catch (e) {
      if ((e as Error).message === "aborted") return { completedTrials: completed, reason: "aborted" };
      if ((e as Error).message === "time_expired") return { completedTrials: completed, reason: "time_expired" };
      throw e;
    }
    if (!rec) return { completedTrials: completed, reason: "aborted" };
    onTrial(rec);
    completed++;

    if (abortSignal.aborted) return { completedTrials: completed, reason: "aborted" };
    if (deadlinePassed(deadlineMs)) return { completedTrials: completed, reason: "time_expired" };

    ui.setStim({ kind: "blank" });
    ui.setInstruction("");
    try {
      await sleep(ITI_MS, abortSignal);
    } catch (e) {
      if ((e as Error).message === "aborted") return { completedTrials: completed, reason: "aborted" };
      throw e;
    }
  }

  return { completedTrials: completed, reason: "completed" };
};

const runOneTrial = async (
  participantId: string,
  subtask: "initiation" | "planning",
  isPractice: boolean,
  trialIndex: number,
  stim: PlanningStim | null,
  deadlineMs: number | null,
  signal: AbortSignal,
  ui: TrialUI,
  isKeyHeld: (code: string) => boolean,
): Promise<TrialRecord | null> => {
  while (true) {
    if (signal.aborted) return null;
    if (deadlinePassed(deadlineMs)) throw new Error("time_expired");

    ui.setStim({ kind: "blank" });
    ui.setInstruction("Hold <span class='key'>SPACE</span> to begin the next trial");
    await waitUntilKeyHeld("Space", signal, isKeyHeld);
    const startKeyDownTime = performance.now();

    ui.setInstruction("Keep holding <span class='key'>SPACE</span>…");
    const foreperiod = FOREPERIOD_MIN_MS + Math.random() * (FOREPERIOD_MAX_MS - FOREPERIOD_MIN_MS);
    const releaseRes = await waitForReleaseOrTimeout("Space", foreperiod, signal);

    if (releaseRes.releasedEarly) {
      ui.setStim({ kind: "false_start" });
      ui.setInstruction("");
      await sleep(FALSE_START_MSG_MS, signal);
      continue;
    }

    const src = subtask === "initiation"
      ? INIT_STIM_FILE
      : `${PLANNING_STIM_DIR}${stim!.file}`;
    ui.setStim({ kind: "image", src });

    const stimulusOnsetTime = await new Promise<number>((res) =>
      requestAnimationFrame(() => res(performance.now())),
    );

    ui.setInstruction(
      subtask === "initiation"
        ? "Release <span class='key'>SPACE</span>, then press <span class='key'>ENTER</span>"
        : "Release <span class='key'>SPACE</span>, then press <span class='key'>←</span> or <span class='key'>→</span>",
    );

    const startKeyReleaseTime = await waitForKeyUp("Space", signal);

    let responseKeyTime: number;
    let responseKeyCode: string;
    let response: "" | "LEFT" | "RIGHT" = "";
    if (subtask === "initiation") {
      responseKeyTime = await waitForKeyDown("Enter", signal);
      responseKeyCode = "Enter";
    } else {
      const r = await waitForAnyKeyDown(["ArrowLeft", "ArrowRight"], signal);
      responseKeyTime = r.time;
      responseKeyCode = r.key;
      response = r.key === "ArrowLeft" ? "LEFT" : "RIGHT";
    }

    const initiationLatency = startKeyReleaseTime - stimulusOnsetTime;
    const movementTime = responseKeyTime - startKeyReleaseTime;
    const totalRT = responseKeyTime - stimulusOnsetTime;

    const rec: TrialRecord = {
      participant_id: participantId,
      task: subtask,
      is_practice: isPractice ? 1 : 0,
      trial_index: trialIndex,
      timestamp_iso: new Date().toISOString(),
      foreperiod_ms: round2(foreperiod),
      stimulus_file: subtask === "initiation" ? INIT_STIM_FILE : stim!.file,
      stim_color: subtask === "planning" ? stim!.color : "",
      stim_stripes: subtask === "planning" ? stim!.stripes : "",
      correct_response: subtask === "planning" ? stim!.correct : "",
      response,
      response_key: responseKeyCode,
      correct: subtask === "planning" ? (response === stim!.correct ? 1 : 0) : "",
      stimulus_onset_ms: round2(stimulusOnsetTime),
      start_key_down_ms: round2(startKeyDownTime),
      start_key_release_ms: round2(startKeyReleaseTime),
      response_key_press_ms: round2(responseKeyTime),
      initiation_latency_ms: round2(initiationLatency),
      movement_time_ms: round2(movementTime),
      total_rt_ms: round2(totalRT),
      planning_rt_ms_correct:
        subtask === "planning" && response === stim!.correct ? round2(totalRT) : "",
    };

    if (isPractice) {
      if (subtask === "planning") {
        ui.setStim({ kind: "feedback", correct: rec.correct === 1, rt_ms: totalRT });
      } else {
        ui.setStim({ kind: "feedback", correct: null, rt_ms: totalRT });
      }
      ui.setInstruction("");
      await sleep(FEEDBACK_MS_PRACTICE, signal);
    }

    return rec;
  }
};

export const meanOf = (rows: TrialRecord[], key: keyof TrialRecord): number | "" => {
  const vals = rows.map((r) => r[key]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!vals.length) return "";
  return round2(vals.reduce((a, b) => a + b, 0) / vals.length);
};
