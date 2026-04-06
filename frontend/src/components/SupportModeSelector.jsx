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
        <label className="text-sm font-semibold text-[var(--text)]">Support Mode</label>
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Personalized output
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            aria-pressed={value === mode.value}
            onClick={() => onChange(mode.value)}
            className={`rounded-[1rem] border p-4 text-left transition-all duration-200 ${
              value === mode.value
                ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_15%,var(--surface-strong))] text-[var(--text)] shadow-[0_8px_24px_rgba(44,40,37,0.08)]"
                : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-strong)_88%,transparent)] text-[var(--text)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]"
            }`}
          >
            <span className="block text-sm font-semibold">{mode.label}</span>
            <span
              className={`mt-1 block text-sm leading-6 ${
                value === mode.value
                  ? "text-[var(--text-soft)]"
                  : "text-[var(--text-soft)]"
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
