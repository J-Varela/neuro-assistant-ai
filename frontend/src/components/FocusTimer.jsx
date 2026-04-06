import { useEffect, useState } from "react";

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusTimer({ minutes = 25, stepText, supportivePrompt, placeholder }) {
  const initialSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // Reset timer whenever the step or duration changes
  useEffect(() => {
    setIsRunning(false);
    setSecondsLeft(minutes * 60);
  }, [minutes, stepText]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const completed = secondsLeft === 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const dashOffset = CIRCUMFERENCE * (1 - secondsLeft / initialSeconds);

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="quiet-kicker">Focus</p>
          <h2 className="ui-title mt-2 text-xl">Timer</h2>
        </div>
        <span className="text-sm text-[var(--text-muted)]">{minutes} min</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
        {stepText || placeholder || "No step selected yet."}
      </p>
      {supportivePrompt ? (
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {supportivePrompt}
        </p>
      ) : null}

      <div className="timer-shell mt-5 flex flex-col items-center px-4 py-5">
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" className="ring-track" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              className="ring-fill"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute text-center">
            <div className="soft-number text-3xl font-semibold text-[var(--text)]">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(true)}
            disabled={isRunning || completed}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => setIsRunning(false)}
            disabled={!isRunning}
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(initialSeconds);
            }}
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        {completed ? (
          <p className="mt-4 text-sm text-[var(--text-soft)]">Session complete.</p>
        ) : null}
      </div>
    </section>
  );
}
