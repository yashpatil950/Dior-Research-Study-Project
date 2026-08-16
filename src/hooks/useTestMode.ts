import { useEffect, useState } from "react";
import { isTestMode, onTestModeChange } from "../lib/testmode";

/** Re-renders the component whenever the test-mode flag is toggled. */
export const useTestMode = (): boolean => {
  const [on, setOn] = useState<boolean>(isTestMode);
  useEffect(() => onTestModeChange(setOn), []);
  return on;
};
