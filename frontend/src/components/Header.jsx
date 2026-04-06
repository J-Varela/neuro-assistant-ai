export default function Header({ darkMode, onToggle, user, onShowAuth, onLogout }) {
  return (
    <header className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="quiet-kicker">NeuroAssistant AI</p>
          <h1 className="ui-title mt-2 text-2xl sm:text-3xl">Reduce overwhelm. Find the next step.</h1>
          <p className="ui-subtle mt-3 max-w-xl text-sm leading-6">
            A calmer workspace for breaking tasks down, simplifying text, and moving into focus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-[var(--text-soft)]">{user.email}</span>
              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onShowAuth}
              className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Sign in
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-label="Toggle dark mode"
            className="btn-secondary rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>
    </header>
  );
}
