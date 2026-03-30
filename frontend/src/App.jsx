import { useEffect, useState } from "react";
import api from "./api/client";
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
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem("neuro-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("neuro-history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (type, input, output) => {
    const entry = {
      id: Date.now(),
      type,
      input,
      output,
      supportMode,
      createdAt: new Date().toLocaleString(),
    };

    setHistory((prev) => [entry, ...prev.slice(0, 5)]);
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
        addToHistory("Task Breakdown", inputText, response.data);
      } else {
        const response = await api.post("/simplify-text", {
          text: inputText,
          support_mode: supportMode,
        });

        setSimplifyResult(response.data);
        addToHistory("Text Simplification", inputText, response.data);
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
    setInputText(item.input);
    setSupportMode(item.supportMode);
    setError("");

    if (item.type === "Task Breakdown") {
      setActiveTab("breakdown");
      setBreakdownResult(item.output);
      setSimplifyResult(null);
      handleSendToFocus(item.output.next_step);
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

  const panelCopy = TAB_COPY[activeTab];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Header darkMode={darkMode} onToggle={() => setDarkMode((value) => !value)} />

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="panel p-5 sm:p-6">
            <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
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

              <h2 className="ui-title mt-5 text-2xl sm:text-3xl">{panelCopy.title}</h2>
              <p className="ui-subtle mt-2 max-w-2xl text-sm leading-6 sm:text-base">
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
                  className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                >
                  {loading ? "Generating..." : panelCopy.cta}
                </button>

                <button
                  onClick={resetWorkspace}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Clear
                </button>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <FocusTimer
              minutes={focusDuration}
              stepText={focusStep}
              supportivePrompt={focusSupportivePrompt}
              placeholder="Generate a breakdown to send the next step here."
            />

            <aside className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Sessions</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">{history.length}/6</span>
              </div>

              <div className="mt-4 space-y-3">
                {history.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No recent sessions yet.
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRestoreSession(item)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          {item.type}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.createdAt}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item.input}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6">
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
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-95 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-900"
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
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-950">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">{step}</p>
                      </div>

                      <button
                        onClick={() => handleSendToFocus(step)}
                        className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                          focusStep === step
                            ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                            : "border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-900"
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
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {simplifyResult.simplified_text}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="result-block">
                  <p className="result-label">Key Points</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {simplifyResult.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="result-block">
                  <p className="result-label">Action Items</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {simplifyResult.action_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </ResultCard>
          ) : (
            <ResultCard title="Results">
              <div className="result-block">
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Generate a task breakdown or simplified text to see the result here.
                </p>
              </div>
            </ResultCard>
          )}
        </section>
      </div>
    </main>
  );
}
