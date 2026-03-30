const modes = [
  { value: "general", label: "General Clarity" },
  { value: "adhd", label: "ADHD Support" },
  { value: "dyslexia", label: "Dyslexia-Friendly" },
  { value: "autism", label: "Autism-Friendly" },
];

export default function SupportModeSelector({ value, onChange }) {
  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Support Mode
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-500"
      >
        {modes.map((mode) => (
          <option key={mode.value} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
    </div>
  );
}