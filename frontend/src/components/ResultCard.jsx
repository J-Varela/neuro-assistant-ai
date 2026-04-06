export default function ResultCard({ title, subtitle, children }) {
  return (
    <div className="panel animate-fadeInUp overflow-hidden">
      <div className="h-px bg-[color:var(--border-strong)]" />
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="mb-6">
          <p className="quiet-kicker">Results</p>
          <h2 className="ui-title section-heading mt-2">{title}</h2>
          {subtitle ? <p className="ui-subtle mt-2 text-sm leading-6">{subtitle}</p> : null}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
