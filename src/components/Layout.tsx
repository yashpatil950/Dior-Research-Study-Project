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
          <Link to="/baseline/start">Baseline ▶</Link>
          <Link to="/aes-avatar">AES Avatar</Link>
          <Link to="/task/1">T1</Link>
          <Link to="/task/2">T2</Link>
          <Link to="/task/3">T3</Link>
          <Link to="/pact">PACT</Link>
          <Link to="/task/4">T4</Link>
          <Link to="/task/5">T5</Link>
          <Link to="/task/6">T6</Link>
          <Link to="/aes-text">AES Text</Link>
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
