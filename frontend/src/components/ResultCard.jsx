export default function ResultCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3 text-slate-700">{children}</div>
    </div>
  );
}