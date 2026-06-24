import { CircularCountdown } from "./CircularCountdown";

/** Compatibility shell — every task page calls this, now backed by the circular countdown. */
export const TaskTimerOverlay = ({
  secondsLeft,
  totalSeconds,
  onStopEarly,
}: {
  secondsLeft: number | null;
  totalSeconds: number;
  onStopEarly?: () => void;
}) => {
  if (secondsLeft === null) return null;
  return (
    <CircularCountdown
      secondsLeft={secondsLeft}
      totalSeconds={totalSeconds}
      onStopEarly={onStopEarly}
    />
  );
};
