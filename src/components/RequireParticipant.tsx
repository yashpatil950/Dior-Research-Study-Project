import { Navigate } from "react-router-dom";
import { getCurrentParticipant } from "../lib/store";
import { ensureTestParticipant } from "../lib/testmode";
import { useTestMode } from "../hooks/useTestMode";

/**
 * Redirect to /login if no participant is signed in — except in test mode,
 * where a task opened directly (jump menu, bookmark, typed URL) signs in the
 * throwaway TEST participant so the screen can be reached without a login.
 */
export const RequireParticipant = ({ children }: { children: React.ReactNode }) => {
  const testMode = useTestMode();
  const name = getCurrentParticipant() ?? (testMode ? ensureTestParticipant() : null);
  if (!name) return <Navigate to="/" replace />;
  return <>{children}</>;
};
