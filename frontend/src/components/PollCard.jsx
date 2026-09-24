export default function PollCard({ poll, dark = false, onVote, onClose }) {
  if (!poll) return null;
  const closed = !!poll.closed;
  const mine = poll.myVote;
  const total = poll.total ?? 0;

  return (
    <div className={`rounded-xl border px-3 py-3 ${dark ? "border-white/20 bg-white/10" : "border-border bg-bg"}`}>
      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-text-primary"}`}>{poll.question}</p>
      <ul className="mt-2 space-y-1.5">
        {(poll.options || []).map((opt) => {
          const selected = mine === opt.index;
          const pct = opt.percent ?? 0;
          return (
            <li key={opt.index}>
              <button
                type="button"
                disabled={closed || !onVote}
                onClick={() => onVote?.(poll.id, opt.index)}
                className={`relative w-full overflow-hidden rounded-lg border text-left px-3 py-2 text-sm transition-colors disabled:cursor-default ${
                  selected
                    ? dark ? "border-white bg-white/20" : "border-action bg-action/10"
                    : dark ? "border-white/20 hover:bg-white/10" : "border-border hover:bg-surface"
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 ${dark ? "bg-white/20" : "bg-action/15"}`}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex items-center justify-between gap-2">
                  <span className={dark ? "text-white" : "text-text-primary"}>{opt.label}</span>
                  <span className={`text-[11px] tabular-nums ${dark ? "text-white/70" : "text-text-secondary"}`}>
                    {pct}% · {opt.count ?? 0}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className={`mt-2 flex items-center justify-between text-[11px] ${dark ? "text-white/70" : "text-text-secondary"}`}>
        <span>{total} vote{total === 1 ? "" : "s"}{closed ? " · Closed" : ""}</span>
        {poll.isCreator && !closed && onClose && (
          <button type="button" onClick={() => onClose(poll.id)} className="font-medium underline underline-offset-2">
            Close poll
          </button>
        )}
      </div>
    </div>
  );
}
