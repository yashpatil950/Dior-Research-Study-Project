import { useEffect, useRef } from "react";

/**
 * Tracks which keys are currently held down at the document level.
 * Returns a stable ref-backed getter and `isHeld(code)` helper so the
 * PACT trial loop can poll without re-rendering on every key event.
 *
 * Also blocks the browser's default Space/arrow-scroll behavior when the
 * target is the body, mirroring the original task's guard.
 */
export const useGlobalKeys = () => {
  const heldRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const held = heldRef.current;
    const onDown = (e: KeyboardEvent) => {
      held.add(e.code);
      if (
        ["Space", "ArrowLeft", "ArrowRight"].includes(e.code) &&
        e.target === document.body
      ) {
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      held.delete(e.code);
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("keyup", onUp);
    };
  }, []);

  return {
    isHeld: (code: string) => heldRef.current.has(code),
  };
};
