import { useEffect, useState } from "react";

export default function FocusTimer({ minutes = 15, stepText }) {
  const initialSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
    setCompleted(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0) {
      setIsRunning(false);
      setCompleted(true);
    }
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Focus Session</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {minutes} min
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-800 p-4">
        <p className="text-sm text-slate-400">Current Step</p>
        <p className="mt-2 leading-7 text-slate-100">
          {stepText || "No step selected yet."}
        </p>
      </div>

      <div className="mt-6 text-center text-5xl font-bold tracking-tight">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>

      <p className="mt-4 text-center text-sm text-slate-300">
        Focus on one step only. You do not need to finish everything at once.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setIsRunning(true)}
          disabled={isRunning || completed}
          className="rounded-xl bg-white px-4 py-2 font-medium text-slate-900 disabled:opacity-40"
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => setIsRunning(false)}
          disabled={!isRunning}
          className="rounded-xl border border-slate-600 px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSecondsLeft(initialSeconds);
            setCompleted(false);
          }}
          className="rounded-xl border border-slate-600 px-4 py-2 font-medium text-white"
        >
          Reset
        </button>
      </div>

      {completed && (
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Focus session complete. Nice work.
        </div>
      )}
    </div>
  );
}
