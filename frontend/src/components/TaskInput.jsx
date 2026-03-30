export default function TaskInput({ value, onChange }) {
  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Enter a task or paste dense text
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder="Example: I need to finish my project report, prepare for a meeting, and organize my notes..."
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-slate-500"
      />
    </div>
  );
}