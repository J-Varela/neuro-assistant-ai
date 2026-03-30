export default function Header({ darkMode, onToggle }) {
  return (
    <header className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="ui-title text-3xl sm:text-4xl">NeuroAssistant AI</h1>
          <p className="ui-subtle mt-2 text-sm leading-6 sm:text-base">
            Reduce overwhelm. Find the next step.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle dark mode"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </header>
  );
}
