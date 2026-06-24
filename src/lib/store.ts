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

/**
 * Sensor averages captured during a task. We compute both the full-duration
 * average and the "last 60 seconds" average for each of:
 *   - Mionix mouse HR
 *   - EmotiBit HR
 *   - EmotiBit EDA (electrodermal activity, EA stream tag)
 */
export interface SensorSnapshot {
  // Full-duration averages
  mouse_hr_avg: number | null;
  mouse_hr_n_samples: number;
  emotibit_hr_avg: number | null;
  emotibit_hr_n_samples: number;
  emotibit_eda_avg: number | null;
  emotibit_eda_n_samples: number;
  // Last-60-seconds averages (computed at task end)
  mouse_hr_avg_last60s: number | null;
  mouse_hr_n_samples_last60s: number;
  emotibit_hr_avg_last60s: number | null;
  emotibit_hr_n_samples_last60s: number;
  emotibit_eda_avg_last60s: number | null;
  emotibit_eda_n_samples_last60s: number;
}

/** @deprecated kept as alias for older types — same shape as SensorSnapshot. */
export type HrSnapshot = SensorSnapshot;

export interface BaselineResult {
  phase: "start" | "end";
  participant_name: string;
  duration_s: number;
  timing: TimingBlock;
  sensors: SensorSnapshot;
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
  sensors: SensorSnapshot;
  file_name: string;
}

/** Result for the AES (Apathy Evaluation Scale) — same shape for Avatar + Text. */
export interface AesResult {
  variant: "avatar" | "text";
  participant_name: string;
  timing: TimingBlock;
  status: TaskStatus;
  sensors: SensorSnapshot;
  n_answered: number;
  n_items: number;
  total_score: number;
  interpretation: "Apathy" | "No Apathy" | "Incomplete";
  file_name: string;
}

/** Generic timed-task result for the questionnaire-style tasks (Form Entry 1/2, Travel Card A/B). */
export interface QuestionnaireResult {
  task_key: TaskKey;
  task_label: string;
  participant_name: string;
  timed: boolean;
  time_limit_s: number | null;
  timing: TimingBlock;
  status: TaskStatus;
  sensors: SensorSnapshot;
  n_answered: number;
  n_items: number;
  file_name: string;
}

/** Email-classification task result (Email Sorting A & B). */
export interface EmailClassificationResult {
  task_key: TaskKey;
  participant_name: string;
  timed: boolean;
  time_limit_s: number | null;
  timing: TimingBlock;
  status: TaskStatus;
  sensors: SensorSnapshot;
  n_emails: number;
  n_answered: number;
  n_correct: number;
  accuracy_pct: number | "";
  file_name: string;
}

/**
 * Content-based task identifiers. The session order is a list of these,
 * which the operator arranges on the Setup screen. Baseline start/end are
 * always first/last respectively.
 */
export type TaskKey =
  | "baseline_start"
  | "baseline_end"
  | "pact"
  | "aes_avatar"
  | "aes_text"
  | "travel_card_a"
  | "travel_card_b"
  | "email_sorting_a"
  | "email_sorting_b"
  | "form_entry_1"
  | "form_entry_2";

/** Human-readable label for a task. */
export const TASK_LABEL: Record<TaskKey, string> = {
  baseline_start: "Baseline (Start)",
  baseline_end: "Baseline (End)",
  pact: "PACT",
  aes_avatar: "AES — Avatar version",
  aes_text: "AES — Text version",
  travel_card_a: "Travel Card A",
  travel_card_b: "Travel Card B",
  email_sorting_a: "Email Sorting A",
  email_sorting_b: "Email Sorting B",
  form_entry_1: "Form Entry 1",
  form_entry_2: "Form Entry 2",
};

/** URL route for a task. */
export const TASK_ROUTE: Record<TaskKey, string> = {
  baseline_start: "/baseline/start",
  baseline_end: "/baseline/end",
  pact: "/pact",
  aes_avatar: "/aes-avatar",
  aes_text: "/aes-text",
  travel_card_a: "/travel-card-a",
  travel_card_b: "/travel-card-b",
  email_sorting_a: "/email-sorting-a",
  email_sorting_b: "/email-sorting-b",
  form_entry_1: "/form-entry-1",
  form_entry_2: "/form-entry-2",
};

/** Excel-file segment for a task — used in the downloaded file name. */
export const TASK_FILE_SEG: Record<TaskKey, string> = {
  baseline_start: "BaselineStart",
  baseline_end: "BaselineEnd",
  pact: "PACT",
  aes_avatar: "AESAvatar",
  aes_text: "AESText",
  travel_card_a: "TravelCardA",
  travel_card_b: "TravelCardB",
  email_sorting_a: "EmailSortingA",
  email_sorting_b: "EmailSortingB",
  form_entry_1: "FormEntry1",
  form_entry_2: "FormEntry2",
};

/** The 9 "middle" tasks the operator can reorder. */
export const REORDERABLE_TASKS: TaskKey[] = [
  "aes_avatar",
  "travel_card_a",
  "travel_card_b",
  "email_sorting_a",
  "pact",
  "form_entry_1",
  "form_entry_2",
  "email_sorting_b",
  "aes_text",
];

export interface ParticipantSession {
  participant_name: string;
  created_iso: string;
  /** Operator-chosen order of the 9 middle tasks; baseline_start at index 0 and baseline_end at the end are implicit. */
  session_order: TaskKey[];
  results: Partial<Record<TaskKey, BaselineResult | PactResult | AesResult | QuestionnaireResult | EmailClassificationResult>>;
}

const KEY_CURRENT = "pact_app.current_participant";
const KEY_ALL = "pact_app.sessions";

const emptySession = (name: string): ParticipantSession => ({
  participant_name: name,
  created_iso: new Date().toISOString(),
  session_order: REORDERABLE_TASKS.slice(),
  results: {},
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

export const setSessionOrder = (name: string, order: TaskKey[]): void => {
  const all = loadAll();
  if (!all[name]) all[name] = emptySession(name);
  all[name].session_order = order;
  saveAll(all);
};

export const getSessionOrder = (name: string): TaskKey[] => {
  const s = getSession(name);
  return s?.session_order ?? REORDERABLE_TASKS.slice();
};

/** Save a per-task result keyed by content. */
export const saveTaskResult = <T extends BaselineResult | PactResult | AesResult | QuestionnaireResult | EmailClassificationResult>(
  name: string,
  key: TaskKey,
  result: T,
): void => {
  const all = loadAll();
  if (!all[name]) all[name] = emptySession(name);
  all[name].results = { ...all[name].results, [key]: result };
  saveAll(all);
};

/** Compute the next route after the given task, based on the participant's session order. */
export const nextRouteAfter = (name: string, current: TaskKey): string => {
  if (current === "baseline_end") return "/admin";
  if (current === "baseline_start") {
    const order = getSessionOrder(name);
    return order.length ? TASK_ROUTE[order[0]] : TASK_ROUTE.baseline_end;
  }
  const order = getSessionOrder(name);
  const i = order.indexOf(current);
  if (i === -1) return "/admin"; // task not in order, just bail to admin
  if (i === order.length - 1) return TASK_ROUTE.baseline_end;
  return TASK_ROUTE[order[i + 1]];
};

export const nextLabelAfter = (name: string, current: TaskKey): string => {
  const route = nextRouteAfter(name, current);
  const entry = (Object.entries(TASK_ROUTE) as [TaskKey, string][]).find(([, r]) => r === route);
  return entry ? TASK_LABEL[entry[0]] : "Admin";
};

export const deleteSession = (name: string): void => {
  const all = loadAll();
  delete all[name];
  saveAll(all);
};

/** Slugify a participant name for safe use in a filename. */
export const safeFileSegment = (s: string): string =>
  s.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 60) || "participant";
