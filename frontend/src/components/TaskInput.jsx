const placeholders = {
  breakdown: "Example: Write a quarterly report for the finance team",
  simplify:
    "Paste a dense email, meeting notes, article excerpt, or assignment instructions that you want rewritten more clearly.",
};

export default function TaskInput({ value, onChange, activeTab }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label
          htmlFor="task-input"
          className="text-sm font-semibold text-[var(--text)]"
        >
          {activeTab === "breakdown" ? "Task or situation" : "Text to simplify"}
        </label>
        <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {value.length} characters
        </span>
      </div>

      <textarea
        id="task-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={9}
        aria-label={activeTab === "breakdown" ? "Task or situation" : "Text to simplify"}
        placeholder={placeholders[activeTab]}
        className="surface-input min-h-[13rem] w-full resize-none rounded-[1rem] px-4 py-4 text-[0.95rem] leading-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200"
      />

      <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
        {activeTab === "breakdown"
          ? "Include deadlines, obstacles, or the part that feels hardest. The more real it is, the better the plan will be."
          : "You can paste rough or unformatted text. The app will pull out the plain-language version and the parts that matter most."}
      </p>
    </div>
  );
}
