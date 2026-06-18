/**
 * Per-participant session store, kept in localStorage so the Admin page can
 * read everything the current participant has done in this session.
 *
 * Data is intentionally kept *per participant + per browser*. There is no
 * backend; everything authoritative lives in the downloaded .xlsx files.
 * What's in localStorage is purely for the Admin dashboard view.
 */

export interface TimingBlock {
  start_iso: string;
  end_iso: string;
  start_unix_ms: number;
  end_unix_ms: number;
  total_ms: number;
}

/** Outcome of a timed task: completed normally, stopped early by operator, or ran out of time. */
export type TaskStatus = "completed" | "stopped_early" | "time_expired" | "non_timed_completed";

/** HR averages captured during a task. */
export interface HrSnapshot {
  mouse_hr_avg: number | null;
  mouse_hr_n_samples: number;
  emotibit_hr_avg: number | null;
  emotibit_hr_n_samples: number;
}

export interface BaselineResult {
  phase: "start" | "end";
  participant_name: string;
  duration_s: number;
  timing: TimingBlock;
  mouse_hr_avg: number | null;
  mouse_hr_n_samples: number;
  emotibit_hr_avg: number | null;
  emotibit_hr_n_samples: number;
  file_name: string;
}

export interface PactResult {
  participant_name: string;
  time_limit_s: number;
  timing: TimingBlock;
  status: "completed" | "stopped_early" | "time_expired";
  init_planned_trials: number;
  init_completed_trials: number;
  init_mean_initiation_latency_ms: number | "";
  init_mean_movement_time_ms: number | "";
  init_mean_total_rt_ms: number | "";
  plan_planned_trials: number;
  plan_completed_trials: number;
  plan_accuracy_pct: number | "";
  plan_mean_planning_rt_ms_correct: number | "";
  plan_mean_movement_time_ms: number | "";
  plan_mean_total_rt_ms: number | "";
  mouse_hr_avg: number | null;
  mouse_hr_n_samples: number;
  emotibit_hr_avg: number | null;
  emotibit_hr_n_samples: number;
  file_name: string;
}

/** Result for the AES (Apathy Evaluation Scale) — same shape for Avatar + Text. */
export interface AesResult {
  variant: "avatar" | "text";
  participant_name: string;
  timed: boolean;
  time_limit_s: number | null;
  timing: TimingBlock;
  status: TaskStatus;
  hr: HrSnapshot;
  n_answered: number;
  n_items: number;
  total_score: number;
  interpretation: "Apathy" | "No Apathy" | "Incomplete";
  file_name: string;
}

/** Generic timed-task result for the questionnaire-style tasks 1–4. */
export interface QuestionnaireResult {
  task_id: number;
  task_label: string;
  participant_name: string;
  timed: boolean;
  time_limit_s: number | null;
  timing: TimingBlock;
  status: TaskStatus;
  hr: HrSnapshot;
  n_answered: number;
  n_items: number;
  file_name: string;
}

/** Email-classification task result (tasks 3 & 6). */
export interface EmailClassificationResult {
  task_id: 3 | 6;
  participant_name: string;
  timed: boolean;
  time_limit_s: number | null;
  timing: TimingBlock;
  status: TaskStatus;
  hr: HrSnapshot;
  n_emails: number;
  n_answered: number;
  n_correct: number;
  accuracy_pct: number | "";
  file_name: string;
}

export interface ParticipantSession {
  participant_name: string;
  created_iso: string;
  baseline_start: BaselineResult | null;
  aes_avatar: AesResult | null;
  task1: QuestionnaireResult | null;
  task2: QuestionnaireResult | null;
  task3: EmailClassificationResult | null;
  pact: PactResult | null;
  task4: QuestionnaireResult | null;
  task5: QuestionnaireResult | null;
  task6: EmailClassificationResult | null;
  aes_text: AesResult | null;
  baseline_end: BaselineResult | null;
}

const KEY_CURRENT = "pact_app.current_participant";
const KEY_ALL = "pact_app.sessions";

const emptySession = (name: string): ParticipantSession => ({
  participant_name: name,
  created_iso: new Date().toISOString(),
  baseline_start: null,
  aes_avatar: null,
  task1: null,
  task2: null,
  task3: null,
  pact: null,
  task4: null,
  task5: null,
  task6: null,
  aes_text: null,
  baseline_end: null,
});

export const setCurrentParticipant = (name: string): void => {
  localStorage.setItem(KEY_CURRENT, name);
  const all = loadAll();
  if (!all[name]) {
    all[name] = emptySession(name);
    saveAll(all);
  }
};

export const getCurrentParticipant = (): string | null => {
  return localStorage.getItem(KEY_CURRENT);
};

export const clearCurrentParticipant = (): void => {
  localStorage.removeItem(KEY_CURRENT);
};

export const loadAll = (): Record<string, ParticipantSession> => {
  const raw = localStorage.getItem(KEY_ALL);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, ParticipantSession>;
    // Forward-compat: backfill any new fields onto older session records.
    for (const k of Object.keys(parsed)) {
      parsed[k] = { ...emptySession(k), ...parsed[k] };
    }
    return parsed;
  } catch {
    return {};
  }
};

const saveAll = (all: Record<string, ParticipantSession>): void => {
  localStorage.setItem(KEY_ALL, JSON.stringify(all));
};

export const getSession = (name: string): ParticipantSession | null => {
  const all = loadAll();
  return all[name] ?? null;
};

const upsert = <K extends keyof ParticipantSession>(
  name: string,
  field: K,
  value: ParticipantSession[K],
): void => {
  const all = loadAll();
  if (!all[name]) all[name] = emptySession(name);
  all[name][field] = value;
  saveAll(all);
};

export const upsertBaseline = (
  name: string,
  phase: "start" | "end",
  result: BaselineResult,
): void => {
  upsert(name, phase === "start" ? "baseline_start" : "baseline_end", result);
};

export const upsertPact = (name: string, result: PactResult): void =>
  upsert(name, "pact", result);

export const upsertAes = (
  name: string,
  variant: "avatar" | "text",
  result: AesResult,
): void => {
  upsert(name, variant === "avatar" ? "aes_avatar" : "aes_text", result);
};

export const upsertQuestionnaire = (
  name: string,
  taskId: 1 | 2 | 4 | 5,
  result: QuestionnaireResult,
): void => {
  const field = `task${taskId}` as const;
  upsert(name, field, result);
};

export const upsertEmailTask = (
  name: string,
  taskId: 3 | 6,
  result: EmailClassificationResult,
): void => {
  const field = `task${taskId}` as const;
  upsert(name, field, result);
};

export const deleteSession = (name: string): void => {
  const all = loadAll();
  delete all[name];
  saveAll(all);
};

/** Slugify a participant name for safe use in a filename. */
export const safeFileSegment = (s: string): string =>
  s.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 60) || "participant";
