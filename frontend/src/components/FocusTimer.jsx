import { useEffect, useState } from "react";

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusTimer({ minutes = 15, stepText }) {
  const initialSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Focus Timer</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{minutes} min</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {stepText || "No step selected yet."}
      </p>

      <div className="mt-5 flex flex-col items-center rounded-xl border border-slate-200 px-4 py-5 dark:border-slate-800">
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
            <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsRunning(true)}
            disabled={isRunning || completed}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => setIsRunning(false)}
            disabled={!isRunning}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(initialSeconds);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Reset
          </button>
        </div>

        {completed ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Session complete.</p>
        ) : null}
      </div>
    </section>
  );
}
