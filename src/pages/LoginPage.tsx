import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setCurrentParticipant } from "../lib/store";
import { ConnectionGate } from "../components/ConnectionGate";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a participant name.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Name is too long (max 60 characters).");
      return;
    }
    setCurrentParticipant(trimmed);
    navigate("/baseline/start");
  };

  return (
    <div className="screen">
      <h1>Participant Sign-In</h1>
      <p>
        Enter the participant's name to begin. The flow is:
        <b> Baseline ▶ → AES Avatar → T1 → T2 → T3 → PACT → T4 → T5 → T6 → AES Text → Baseline ◀ → Admin.</b>
      </p>

      <ConnectionGate />

      <form className="instructions" onSubmit={onSubmit}>
        <div className="form-row">
          <label htmlFor="name">Participant name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. P001 or Jane Doe"
            autoFocus
            autoComplete="off"
          />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-success">Continue → Baseline (start)</button>
        </div>
        <p className="hint">
          This name is used to label every downloaded file
          (<code>{"<name>_baseline_start_data.xlsx"}</code>, etc.) and to identify the session in the
          Admin dashboard. Files are saved to your Downloads folder.
        </p>
      </form>
    </div>
  );
};
