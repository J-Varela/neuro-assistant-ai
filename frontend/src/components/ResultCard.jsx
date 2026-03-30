export default function ResultCard({ title, subtitle, children }) {
  return (
    <div className="animate-fadeInUp overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-[0_28px_90px_rgba(24,31,28,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#08110f]/80">
      <div className="h-1.5 bg-[linear-gradient(90deg,#123c34_0%,#2f7d68_45%,#e39554_100%)] dark:bg-[linear-gradient(90deg,#7be0c3_0%,#3ea789_45%,#ffc28e_100%)]" />
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="ui-title text-2xl sm:text-3xl">{title}</h2>
          {subtitle ? <p className="ui-subtle mt-2 text-sm leading-6 sm:text-base">{subtitle}</p> : null}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
