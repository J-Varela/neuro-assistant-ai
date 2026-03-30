const placeholders = {
  breakdown:
    "Example: I need to finish my project report, prep for a meeting, answer messages, and organize my notes before 4 PM.",
  simplify:
    "Paste a dense email, meeting notes, article excerpt, or assignment instructions that you want rewritten more clearly.",
};

export default function TaskInput({ value, onChange, activeTab }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#123c34] dark:text-[#d7f3eb]">
          {activeTab === "breakdown" ? "Task or situation" : "Text to simplify"}
        </label>
        <span className="text-xs uppercase tracking-[0.22em] text-[#79938c] dark:text-[#7eb7a8]">
          {value.length} characters
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={9}
        placeholder={placeholders[activeTab]}
        className="min-h-[14rem] w-full resize-none rounded-[1.5rem] border border-[#123c34]/10 bg-[#f9fcfb] px-5 py-4 text-[#14312b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition-all duration-200 placeholder:text-[#89a49c] focus:border-[#123c34]/30 focus:bg-white focus:ring-4 focus:ring-[#123c34]/8 dark:border-white/10 dark:bg-[#0d1c19] dark:text-[#d8f5ec] dark:placeholder:text-[#6d9287] dark:focus:border-[#7be0c3]/35 dark:focus:bg-[#112420] dark:focus:ring-[#7be0c3]/10"
      />

      <p className="mt-3 text-sm leading-6 text-[#5e7971] dark:text-[#9dc8bd]">
        {activeTab === "breakdown"
          ? "Include deadlines, obstacles, or the part that feels hardest. The more real it is, the better the plan will be."
          : "You can paste rough or unformatted text. The app will pull out the plain-language version and the parts that matter most."}
      </p>
    </div>
  );
}
