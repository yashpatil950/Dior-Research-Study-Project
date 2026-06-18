import { useEffect, useState } from "react";
import { sensors, type ConnectionState } from "../lib/sensors";

export const useConnectionState = (): ConnectionState => {
  const [state, setState] = useState<ConnectionState>(() => sensors.getState());
  useEffect(() => sensors.onStateChange(setState), []);
  return state;
};
