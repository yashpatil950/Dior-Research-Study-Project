import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { sensors } from "./lib/sensors";

// Sensor singleton starts the moment the app boots, so connection state is
// known by the time the first screen renders. Intentionally not inside
// React.StrictMode (which would double-invoke effects in dev and is the
// wrong fit for a stateful trial-loop app).
sensors.start();

createRoot(document.getElementById("root")!).render(<App />);
