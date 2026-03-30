const modes = [
  { value: "general", label: "General", detail: "Steady, balanced guidance." },
  { value: "adhd", label: "ADHD", detail: "Lower friction and shorter hops." },
  { value: "dyslexia", label: "Dyslexia", detail: "Cleaner reading structure." },
  { value: "autism", label: "Autism", detail: "Direct language and explicit order." },
];

export default function SupportModeSelector({ value, onChange }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#123c34] dark:text-[#d7f3eb]">Support Mode</label>
        <span className="text-xs uppercase tracking-[0.22em] text-[#79938c] dark:text-[#7eb7a8]">
          Personalized output
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`rounded-[1.25rem] border p-4 text-left transition-all duration-200 ${
              value === mode.value
                ? "border-[#123c34] bg-[#123c34] text-white shadow-[0_16px_40px_rgba(18,60,52,0.18)] dark:border-[#7be0c3] dark:bg-[#7be0c3] dark:text-[#07231e]"
                : "border-[#123c34]/10 bg-[#f9fcfb] text-[#123c34] hover:-translate-y-0.5 hover:border-[#123c34]/20 hover:bg-white dark:border-white/10 dark:bg-[#0d1c19] dark:text-[#d7f3eb] dark:hover:bg-[#102520]"
            }`}
          >
            <span className="block text-sm font-semibold">{mode.label}</span>
            <span
              className={`mt-1 block text-sm leading-6 ${
                value === mode.value
                  ? "text-white/85 dark:text-[#07231e]/80"
                  : "text-[#5e7971] dark:text-[#9dc8bd]"
              }`}
            >
              {mode.detail}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
