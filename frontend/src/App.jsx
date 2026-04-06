import { useCallback, useEffect, useState } from "react";
import api from "./api/client";
import { getMe } from "./api/auth";
import { logout as apiLogout } from "./api/auth";
import AuthModal from "./components/AuthModal";
import Header from "./components/Header";
import SupportModeSelector from "./components/SupportModeSelector";
import TaskInput from "./components/TaskInput";
import ResultCard from "./components/ResultCard";
import FocusTimer from "./components/FocusTimer";

const TAB_COPY = {
  breakdown: {
    title: "Break down a task",
    description: "Turn one overwhelming task into a smaller, usable plan.",
    cta: "Generate Task Plan",
  },
  simplify: {
    title: "Simplify text",
    description: "Rewrite dense writing into something easier to read and act on.",
    cta: "Simplify Content",
  },
};

export default function App() {
  const [supportMode, setSupportMode] = useState("general");
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState("breakdown");
  const [breakdownResult, setBreakdownResult] = useState(null);
  const [simplifyResult, setSimplifyResult] = useState(null);
  const [focusStep, setFocusStep] = useState("");
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusSupportivePrompt, setFocusSupportivePrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoadError, setHistoryLoadError] = useState(false);
  const [deletingHistoryIds, setDeletingHistoryIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("neuro-dark-mode") === "true"; } catch { return false; }
  });
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("neuro-auth-user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [showAuth, setShowAuth] = useState(false);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("neuro-auth-token");
    localStorage.removeItem("neuro-refresh-token");
    localStorage.removeItem("neuro-auth-user");
    setUser(null);
  }, []);

  const loadHistory = useCallback(() => {
    return api
      .get("/history")
      .then((res) => {
        setHistory(res.data);
        setHistoryLoadError(false);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          clearAuth();
          return api
            .get("/history")
            .then((res) => {
              setHistory(res.data);
              setHistoryLoadError(false);
            });
        }
        setHistoryLoadError(true);
      });
  }, [clearAuth]);

  // Validate stored token on load
  useEffect(() => {
    const token = localStorage.getItem("neuro-auth-token");
    if (token) {
      getMe()
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          loadHistory();
        });
      return;
    }
    loadHistory();
  }, []);

  // Sync React state when the token refresh interceptor forces a sign-out
  useEffect(() => {
    const handleAuthLogout = () => { clearAuth(); };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, [clearAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try { localStorage.setItem("neuro-dark-mode", String(darkMode)); } catch {}
  }, [darkMode]);

  const refreshHistory = () => {
    loadHistory().catch(() => {});
  };

  const handleLogin = (userData, token, refreshToken) => {
    localStorage.setItem("neuro-auth-token", token);
    localStorage.setItem("neuro-refresh-token", refreshToken);
    localStorage.setItem("neuro-auth-user", JSON.stringify(userData));
    setUser(userData);
    setShowAuth(false);
    refreshHistory();
  };

  const handleLogout = () => {
    const refreshToken = localStorage.getItem("neuro-refresh-token");
    if (refreshToken) {
      apiLogout(refreshToken).catch(() => {}); // best-effort server-side revocation
    }
    clearAuth();
    refreshHistory();
  };

  const handleDeleteHistory = (id, e) => {
    e.stopPropagation();
    if (deletingHistoryIds.includes(id)) return;

    setDeletingHistoryIds((prev) => [...prev, id]);
    api.delete(`/history/${id}`)
      .then(() => setHistory((prev) => prev.filter((item) => item.id !== id)))
      .catch(() => {})
      .finally(() => {
        setDeletingHistoryIds((prev) => prev.filter((itemId) => itemId !== id));
      });
  };

  const handleSendToFocus = (step) => {
    setFocusStep(step);
    api
      .post("/generate-focus-session", {
        step_text: step,
        support_mode: supportMode,
      })
      .then((res) => {
        setFocusDuration(res.data.duration_minutes);
        setFocusSupportivePrompt(res.data.supportive_prompt);
      })
      .catch(() => {
        setFocusSupportivePrompt("Focus on just this step. You can do this.");
      });
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError("");
    setBreakdownResult(null);
    setSimplifyResult(null);

    try {
      if (activeTab === "breakdown") {
        const response = await api.post("/breakdown-task", {
          text: inputText,
          support_mode: supportMode,
        });

        setBreakdownResult(response.data);
        handleSendToFocus(response.data.next_step);
        refreshHistory();
      } else {
        const response = await api.post("/simplify-text", {
          text: inputText,
          support_mode: supportMode,
        });

        setSimplifyResult(response.data);
        refreshHistory();
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422) {
        setError("Invalid input. Please check your text and try again.");
      } else if (err.response?.status >= 500) {
        setError("The AI service is temporarily unavailable. Please try again later.");
      } else {
        setError("Something went wrong. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSession = (item) => {
    setError("");
    setSupportMode(item.supportMode);

    if (item.type === "Focus Session") {
      setFocusStep(item.input);
      setFocusSupportivePrompt(item.output.supportive_prompt || "");
      setFocusDuration(item.output.duration_minutes || 25);
      return;
    }

    setInputText(item.input);

    if (item.type === "Task Breakdown") {
      setActiveTab("breakdown");
      setBreakdownResult(item.output);
      setSimplifyResult(null);
      setFocusStep(item.output.next_step);
      setFocusSupportivePrompt("Focus on just this step. You can do this.");
      setFocusDuration(25);
      return;
    }

    setActiveTab("simplify");
    setSimplifyResult(item.output);
    setBreakdownResult(null);
  };

  const resetWorkspace = () => {
    setInputText("");
    setBreakdownResult(null);
    setSimplifyResult(null);
    setFocusStep("");
    setFocusDuration(25);
    setFocusSupportivePrompt("");
    setError("");
  };

  const displayedHistory = history.filter((item) => item.type !== "Focus Session");
  const panelCopy = TAB_COPY[activeTab];

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Header
          darkMode={darkMode}
          onToggle={() => setDarkMode((value) => !value)}
          user={user}
          onShowAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
        />

        {showAuth && (
          <AuthModal onLogin={handleLogin} onClose={() => setShowAuth(false)} />
        )}

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          {/* Left column: input panel + results stacked */}
          <div className="space-y-6">
            <div className="panel p-5 sm:p-6">
              <div className="border-b border-[var(--border)] pb-5">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TAB_COPY).map(([tabKey, copy]) => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={`tab-button ${activeTab === tabKey ? "tab-button-active" : ""}`}
                    >
                      {copy.title}
                    </button>
                  ))}
                </div>

                <p className="quiet-kicker mt-5">Workspace</p>
                <h2 className="ui-title mt-2 text-[1.65rem] leading-tight sm:text-[2rem]">{panelCopy.title}</h2>
                <p className="ui-subtle mt-2 max-w-2xl text-sm leading-6">
                  {panelCopy.description}
                </p>
              </div>

              <div className="mt-6 space-y-6">
                <SupportModeSelector value={supportMode} onChange={setSupportMode} />
                <TaskInput value={inputText} onChange={setInputText} activeTab={activeTab} />

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary rounded-lg px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? "Generating..." : panelCopy.cta}
                  </button>

                  <button
                    onClick={resetWorkspace}
                    className="btn-secondary rounded-lg px-5 py-3 text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {error ? (
                  <div className="status-error rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            {breakdownResult ? (
              <ResultCard title="Task Breakdown">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="result-block">
                    <p className="result-label">Goal</p>
                    <p className="result-text">{breakdownResult.goal}</p>
                  </div>

                  <div className="result-block">
                    <p className="result-label">Estimated Effort</p>
                    <p className="result-text">{breakdownResult.estimated_effort}</p>
                  </div>
                </div>

                <div className="result-block">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="result-label">Next Step</p>
                      <p className="result-text">{breakdownResult.next_step}</p>
                    </div>
                    <button
                      onClick={() => handleSendToFocus(breakdownResult.next_step)}
                      className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95"
                    >
                      Send to Focus
                    </button>
                  </div>
                </div>

                <div>
                  <p className="result-label mb-3">Steps</p>
                  <div className="space-y-3">
                    {breakdownResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-strong)_84%,transparent)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-medium text-[var(--text)]">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-7 text-[var(--text)]">{step}</p>
                        </div>

                        <button
                          onClick={() => handleSendToFocus(step)}
                          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                            focusStep === step
                              ? "btn-primary"
                              : "btn-secondary"
                          }`}
                        >
                          {focusStep === step ? "Focused" : "Focus"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </ResultCard>
            ) : simplifyResult ? (
              <ResultCard title="Simplified Output">
                <div className="result-block">
                  <p className="result-label">Simplified Text</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text)]">
                    {simplifyResult.simplified_text}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="result-block">
                    <p className="result-label">Key Points</p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--text)]">
                      {simplifyResult.key_points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="result-block">
                    <p className="result-label">Action Items</p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--text)]">
                      {simplifyResult.action_items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ResultCard>
            ) : null}
          </div>

          {/* Right column: sticky timer + history */}
          <div className="space-y-6 self-start sticky top-6">
            <FocusTimer
              minutes={focusDuration}
              stepText={focusStep}
              supportivePrompt={focusSupportivePrompt}
              placeholder="Generate a breakdown to send the next step here."
            />

            <aside className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="quiet-kicker">History</p>
                  <h2 className="ui-title mt-2 text-lg">Recent Sessions</h2>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {displayedHistory.length} {displayedHistory.length === 1 ? "session" : "sessions"}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {historyLoadError ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-5 text-sm text-[var(--text-soft)]">
                    Could not load history. Check your connection.
                  </div>
                ) : displayedHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--text-muted)]">
                    No recent sessions yet.
                  </div>
                ) : (
                  displayedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="history-card group relative rounded-xl"
                    >
                      <button
                        type="button"
                        onClick={() => handleRestoreSession(item)}
                        className="block w-full rounded-xl px-4 py-3 pr-24 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[var(--text)]">
                            {item.type}
                          </span>
                          <span className="shrink-0 text-xs text-[var(--text-muted)]">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">
                          {item.input}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="history-delete absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium transition-colors"
                        aria-label={`Delete ${item.type} history entry`}
                        disabled={deletingHistoryIds.includes(item.id)}
                      >
                        {deletingHistoryIds.includes(item.id) ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
