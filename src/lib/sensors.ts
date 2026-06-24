/**
 * Sensor connection layer.
 *
 * Manages two WebSockets:
 *   - Mionix mouse:     ws://localhost:7681  (subprotocol "mionix-beta")
 *   - EmotiBit bridge:  ws://localhost:8765
 *
 * Exposes a singleton you can subscribe to from any React component.
 * Connection state, latest sample, and per-sample callbacks are all
 * routed through this module so the rest of the app never touches WS
 * objects directly.
 */

export type SensorName = "mouse" | "emotibit";
export type SensorStatus = "connecting" | "connected" | "disconnected" | "error";

export interface ConnectionState {
  mouse: SensorStatus;
  emotibit: SensorStatus;
}

export interface MouseBioMetricsSample {
  ts_iso: string;
  unix_ms: number;
  heartRate: number | null;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  heartRateState: string | null;
  heartRateQuality: number | null;
  gsr: number | null;
  raw: Record<string, unknown>;
}

export interface EmotiBitSample {
  ts_iso: string;
  unix_ms: number;
  emotibit_time: string;
  stream_tag: string;
  reliability: string;
  value: number | string;
  raw: Record<string, unknown>;
}

type Listener<T> = (value: T) => void;

const MOUSE_HR_TAGS = new Set(["HR", "BPM", "HEART_RATE", "HRM"]);
const EMOTIBIT_EDA_TAGS = new Set(["EA"]);

const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const toNumOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const detectGsr = (d: Record<string, unknown>): number | null => {
  for (const k of ["gsr", "GSR", "galvanicSkinResponse", "skinConductance", "eda"]) {
    const v = d[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};

/**
 * EmotiBit packets often pack multiple samples into one payload (comma-separated).
 * We take the last sample so downstream code gets a single scalar per event.
 */
const normalizeEmotiBitValue = (value: unknown): number | string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return value;
  let s = String(value).trim();
  if (s === "") return "";
  if (s.indexOf(",") !== -1) {
    const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) s = parts[parts.length - 1];
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : s;
};

class SensorBus {
  private mouseRetry: ReturnType<typeof setTimeout> | null = null;
  private emotiRetry: ReturnType<typeof setTimeout> | null = null;

  private state: ConnectionState = {
    mouse: "connecting",
    emotibit: "connecting",
  };

  latestMouse: MouseBioMetricsSample | null = null;
  latestEmotiBit: EmotiBitSample | null = null;
  latestEmotiBitByTag: Record<string, EmotiBitSample> = {};

  private stateListeners = new Set<Listener<ConnectionState>>();
  private mouseListeners = new Set<Listener<MouseBioMetricsSample>>();
  private emotiListeners = new Set<Listener<EmotiBitSample>>();

  start() {
    this.connectMouse();
    this.connectEmotiBit();
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  /** Treat status as "ok" if connected. Anything else means the user should be warned. */
  isOk(name: SensorName): boolean {
    return this.state[name] === "connected";
  }

  onStateChange(cb: Listener<ConnectionState>): () => void {
    this.stateListeners.add(cb);
    cb(this.getState());
    return () => this.stateListeners.delete(cb);
  }

  onMouseSample(cb: Listener<MouseBioMetricsSample>): () => void {
    this.mouseListeners.add(cb);
    return () => this.mouseListeners.delete(cb);
  }

  onEmotiBitSample(cb: Listener<EmotiBitSample>): () => void {
    this.emotiListeners.add(cb);
    return () => this.emotiListeners.delete(cb);
  }

  private setStatus(name: SensorName, status: SensorStatus) {
    if (this.state[name] === status) return;
    this.state = { ...this.state, [name]: status };
    for (const cb of this.stateListeners) cb(this.getState());
  }

  private connectMouse() {
    if (this.mouseRetry) {
      clearTimeout(this.mouseRetry);
      this.mouseRetry = null;
    }
    this.setStatus("mouse", "connecting");
    try {
      const ws = new WebSocket("ws://localhost:7681", "mionix-beta");

      ws.onopen = () => {
        this.setStatus("mouse", "connected");
        try {
          ws.send(JSON.stringify({ type: "getDevices" }));
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => this.setStatus("mouse", "error");
      ws.onclose = () => {
        this.setStatus("mouse", "disconnected");
        this.mouseRetry = setTimeout(() => this.connectMouse(), 2500);
      };
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as { type?: string } & Record<string, unknown>;
          if (data.type === "bioMetrics") {
            const sample: MouseBioMetricsSample = {
              ts_iso: new Date().toISOString(),
              unix_ms: Date.now(),
              heartRate: toNumOrNull(data.heartRate),
              heartRateAvg: toNumOrNull(data.heartRateAvg),
              heartRateMax: toNumOrNull(data.heartRateMax),
              heartRateState: (data.heartRateState as string) ?? null,
              heartRateQuality: toNumOrNull(data.heartRateQuality),
              gsr: detectGsr(data),
              raw: data,
            };
            this.latestMouse = sample;
            for (const cb of this.mouseListeners) cb(sample);
          }
        } catch {
          /* ignore malformed */
        }
      };
    } catch {
      this.setStatus("mouse", "error");
      this.mouseRetry = setTimeout(() => this.connectMouse(), 2500);
    }
  }

  private connectEmotiBit() {
    if (this.emotiRetry) {
      clearTimeout(this.emotiRetry);
      this.emotiRetry = null;
    }
    this.setStatus("emotibit", "connecting");
    try {
      const ws = new WebSocket("ws://localhost:8765");

      ws.onopen = () => this.setStatus("emotibit", "connected");
      ws.onerror = () => this.setStatus("emotibit", "error");
      ws.onclose = () => {
        this.setStatus("emotibit", "disconnected");
        this.emotiRetry = setTimeout(() => this.connectEmotiBit(), 2500);
      };
      ws.onmessage = (msg) => {
        try {
          const pkt = JSON.parse(msg.data) as Record<string, unknown>;
          const sample: EmotiBitSample = {
            ts_iso: new Date().toISOString(),
            unix_ms: (pkt.unix_ms as number) ?? Date.now(),
            emotibit_time: (pkt.emotibit_time as string) ?? "",
            stream_tag: (pkt.stream_tag as string) ?? "",
            reliability: (pkt.reliability as string) ?? "",
            value: normalizeEmotiBitValue(pkt.value),
            raw: pkt,
          };
          this.latestEmotiBit = sample;
          if (sample.stream_tag) {
            this.latestEmotiBitByTag[sample.stream_tag.toUpperCase()] = sample;
          }
          for (const cb of this.emotiListeners) cb(sample);
        } catch {
          /* ignore malformed */
        }
      };
    } catch {
      this.setStatus("emotibit", "error");
      this.emotiRetry = setTimeout(() => this.connectEmotiBit(), 2500);
    }
  }

  /** Return the latest EmotiBit heart-rate value, or null if none seen. */
  getLatestEmotiBitHr(): number | null {
    for (const tag of MOUSE_HR_TAGS) {
      const s = this.latestEmotiBitByTag[tag];
      if (s && isFiniteNum(s.value)) return s.value;
    }
    return null;
  }
}

export const sensors = new SensorBus();

/** Helper: is the given EmotiBit sample a heart-rate sample? */
export const isEmotiBitHrSample = (s: EmotiBitSample): boolean =>
  MOUSE_HR_TAGS.has(s.stream_tag.toUpperCase());

/** Helper: is the given EmotiBit sample an EDA (electrodermal activity) sample? */
export const isEmotiBitEdaSample = (s: EmotiBitSample): boolean =>
  EMOTIBIT_EDA_TAGS.has(s.stream_tag.toUpperCase());
