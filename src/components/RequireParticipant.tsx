import { Navigate } from "react-router-dom";
import { getCurrentParticipant } from "../lib/store";

/** Redirect to /login if no participant is signed in. */
export const RequireParticipant = ({ children }: { children: React.ReactNode }) => {
  const name = getCurrentParticipant();
  if (!name) return <Navigate to="/" replace />;
  return <>{children}</>;
};
