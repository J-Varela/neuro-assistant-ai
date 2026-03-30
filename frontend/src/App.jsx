import { useState } from "react";
import api from "./api/client";
import Header from "./components/Header";
import SupportModeSelector from "./components/SupportModeSelector";
import TaskInput from "./components/TaskInput";
import ResultCard from "./components/ResultCard";
import FocusTimer from "./components/FocusTimer";

export default function App() {
  const [supportMode, setSupportMode] = useState("general");
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState("breakdown");
  const [breakdownResult, setBreakdownResult] = useState(null);
  const [simplifyResult, setSimplifyResult] = useState(null);
  const [focusStep, setFocusStep] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setFocusStep(response.data.next_step);
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
      setError("Something went wrong while generating the response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <Header />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`rounded-xl px-4 py-2 font-medium transition ${
                  activeTab === "breakdown"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Break Down Task
              </button>

              <button
                onClick={() => setActiveTab("simplify")}
                className={`rounded-xl px-4 py-2 font-medium transition ${
                  activeTab === "simplify"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Simplify Text
              </button>
            </div>

            <SupportModeSelector value={supportMode} onChange={setSupportMode} />
            <TaskInput value={inputText} onChange={setInputText} />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading
                  ? "Generating..."
                  : activeTab === "breakdown"
                  ? "Generate Task Plan"
                  : "Simplify Content"}
              </button>

              <button
                onClick={() => {
                  setInputText("");
                  setBreakdownResult(null);
                  setSimplifyResult(null);
                  setError("");
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </section>

          <section>
            <FocusTimer minutes={15} stepText={focusStep || "Generate a breakdown to start a focus session."} />
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            {breakdownResult && (
              <ResultCard title="Task Breakdown">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Goal</p>
                  <p className="mt-1 font-medium text-slate-900">{breakdownResult.goal}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Next Step</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{breakdownResult.next_step}</p>
                    <button
                      onClick={() => setFocusStep(breakdownResult.next_step)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      Send to Focus
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estimated Effort</p>
                  <p className="mt-1 font-medium text-slate-900">{breakdownResult.estimated_effort}</p>
                </div>

                <div>
                  <p className="mb-3 text-sm text-slate-500">Steps</p>
                  <div className="space-y-3">
                    {breakdownResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                            {index + 1}
                          </div>
                          <p className="pt-1 text-slate-800">{step}</p>
                        </div>

                        <button
                          onClick={() => setFocusStep(step)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                        >
                          Focus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </ResultCard>
            )}

            {simplifyResult && (
              <ResultCard title="Simplified Output">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Simplified Text</p>
                  <p className="mt-2 whitespace-pre-line leading-7 text-slate-800">
                    {simplifyResult.simplified_text}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm text-slate-500">Key Points</p>
                  <ul className="list-disc space-y-2 pl-6 text-slate-800">
                    {simplifyResult.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm text-slate-500">Action Items</p>
                  <ul className="list-disc space-y-2 pl-6 text-slate-800">
                    {simplifyResult.action_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </ResultCard>
            )}
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Recent Sessions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your latest generated support outputs
            </p>

            <div className="mt-4 space-y-4">
              {history.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No sessions yet. Generate your first result.
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {item.type}
                      </span>
                      <span className="text-xs text-slate-500">{item.createdAt}</span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm text-slate-700">{item.input}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Mode: {item.supportMode}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}