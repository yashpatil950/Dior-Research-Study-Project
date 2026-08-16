/**
 * Test mode — lets the interface be walked through without the Mionix mouse
 * or the EmotiBit connected.
 *
 * When it's on:
 *   - every "Start" button ignores the sensor check, so any task or
 *     questionnaire can be opened and completed with no hardware attached;
 *   - the topbar grows a "Jump to…" menu, so you can go straight to a task
 *     instead of having to run Baseline (Start) first;
 *   - opening a task with nobody signed in signs in a throwaway participant
 *     (TEST) rather than bouncing back to the login screen.
 *
 * Nothing else changes: tasks still record whatever samples arrive and still
 * download their .xlsx on finish — with no sensors connected the HR/EDA
 * columns simply come out empty. Files are prefixed with the participant name,
 * so anything captured in test mode lands as TEST_*.xlsx unless a real
 * participant is signed in.
 *
 * The flag lives in localStorage so a reload keeps it, and `?test=1` /
 * `?test=0` on any URL flips it (handy as a bookmark).
 */

import { getCurrentParticipant, setCurrentParticipant } from "./store";

const KEY = "pact_app.test_mode";

/** Participant auto-signed-in when a task is opened in test mode with nobody logged in. */
export const TEST_PARTICIPANT = "TEST";

type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();

const readStored = (): boolean => localStorage.getItem(KEY) === "1";

/** ?test=1 / ?test=0 overrides the stored value on load. */
const readUrlOverride = (): boolean | null => {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("test");
  if (raw === null) return null;
  return raw !== "0" && raw.toLowerCase() !== "false";
};

let enabled = readUrlOverride() ?? readStored();
if (enabled !== readStored()) localStorage.setItem(KEY, enabled ? "1" : "0");

export const isTestMode = (): boolean => enabled;

/** Sign in the throwaway test participant if nobody is signed in. Returns the active name. */
export const ensureTestParticipant = (): string => {
  const current = getCurrentParticipant();
  if (current) return current;
  setCurrentParticipant(TEST_PARTICIPANT);
  return TEST_PARTICIPANT;
};

export const setTestMode = (on: boolean): void => {
  if (on === enabled) return;
  enabled = on;
  localStorage.setItem(KEY, on ? "1" : "0");
  // So the operator can jump straight to a task without stopping at the
  // login screen. Never overwrites a real participant that's already signed in.
  if (on) ensureTestParticipant();
  listeners.forEach((fn) => fn(on));
};

/** Subscribe to changes; the callback fires immediately with the current value. */
export const onTestModeChange = (cb: Listener): (() => void) => {
  listeners.add(cb);
  cb(enabled);
  return () => listeners.delete(cb);
};
