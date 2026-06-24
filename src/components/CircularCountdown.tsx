import { useEffect, useRef } from "react";
import { URGENT_THRESHOLD_S } from "../hooks/useTaskTiming";

/**
 * Large fixed circular countdown timer.
 *
 * - SVG ring that depletes from 100% → 0% as time runs out.
 * - Center text in MM:SS, monospace, very large so it's hard to miss.
 * - Ticking sound played once per whole second via Web Audio API (no audio
 *   asset needed). The AudioContext is created lazily and resumed on the
 *   first call after a user gesture, so browsers won't block it.
 * - Turns red under 30 seconds.
 * - Positioned away from screen edges so it stays fully visible.
 */
export const CircularCountdown = ({
  secondsLeft,
  totalSeconds,
  onStopEarly,
}: {
  secondsLeft: number;
  totalSeconds: number;
  onStopEarly?: () => void;
}) => {
  const lastWholeSecRef = useRef<number>(Math.ceil(secondsLeft));
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const whole = Math.ceil(secondsLeft);
    if (whole !== lastWholeSecRef.current && whole >= 0 && whole < totalSeconds) {
      lastWholeSecRef.current = whole;
      playTick();
    }
    // also keep the ref up to date when the timer hasn't ticked yet
    if (whole > lastWholeSecRef.current) lastWholeSecRef.current = whole;
  }, [secondsLeft, totalSeconds]);

  const playTick = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx: typeof AudioContext = window.AudioContext
          ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current!;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      /* swallow — ticking is a nice-to-have, not a hard requirement */
    }
  };

  const urgent = secondsLeft < URGENT_THRESHOLD_S;

  // Ring math
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const dashOffset = c * (1 - frac);

  const total = Math.max(0, Math.ceil(secondsLeft));
  const m = Math.floor(total / 60);
  const sec = total - m * 60;
  const label = `${m}:${sec.toString().padStart(2, "0")}`;

  return (
    <div className={`circ-countdown ${urgent ? "urgent" : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="rgba(255,255,255,0.94)"
          stroke="#e5e7eb" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={urgent ? "#c0392b" : "#2c7ed1"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 200ms linear, stroke 200ms" }}
        />
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="central"
          fontFamily="Menlo, Consolas, monospace"
          fontWeight="700"
          fontSize="52"
          fill={urgent ? "#c0392b" : "#1a1a1a"}
        >
          {label}
        </text>
      </svg>
      {onStopEarly && (
        <button className="circ-stop-btn" onClick={onStopEarly}>
          End early & save
        </button>
      )}
    </div>
  );
};
