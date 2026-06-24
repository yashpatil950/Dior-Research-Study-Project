import { Link, useNavigate } from "react-router-dom";
import { getCurrentParticipant, clearCurrentParticipant } from "../lib/store";
import { SensorStatusBar } from "./SensorStatus";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const participant = getCurrentParticipant();

  const onLogout = () => {
    if (!confirm("Sign out the current participant? Their saved session data will remain in the Admin page.")) return;
    clearCurrentParticipant();
    navigate("/");
  };

  return (
    <div className="app">
      <div className="topbar">
        <span className="title">PACT + Sensor Capture</span>
        <span className="nav-links">
          <Link to="/session-setup">Setup</Link>
          <Link to="/baseline/start">Baseline ▶</Link>
          <Link to="/baseline/end">Baseline ◀</Link>
          <Link to="/admin">Admin</Link>
        </span>
        <SensorStatusBar />
        <span className="pid">{participant ? `Participant: ${participant}` : "Not signed in"}</span>
        {participant && (
          <button onClick={onLogout}>Sign out</button>
        )}
      </div>
      {children}
    </div>
  );
};
