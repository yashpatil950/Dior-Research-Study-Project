import { useEffect, useState } from "react";
import { sensors, type ConnectionState } from "../lib/sensors";
import { useTestMode } from "./useTestMode";

export const useConnectionState = (): ConnectionState => {
  const [state, setState] = useState<ConnectionState>(() => sensors.getState());
  useEffect(() => sensors.onStateChange(setState), []);
  return state;
};

/**
 * Whether a task is allowed to start: both sensors live, or test mode is on.
 * Every "Start" button gates on this rather than on the raw connection state.
 */
export const useCanStartTask = (): boolean => {
  const state = useConnectionState();
  const testMode = useTestMode();
  return testMode || (state.emotibit === "connected" && state.mouse === "connected");
};
