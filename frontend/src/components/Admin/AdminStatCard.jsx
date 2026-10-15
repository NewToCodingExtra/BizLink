export default function AdminStatCard({
  label,
  value,
  sublabel = null,
  icon: Icon = null,
  trend = null, // e.g. "+12%" or { value: 12, label: "vs last week" }
  variant = "default", // "default", "primary", "emerald", "amber", "rose", "violet"
}) {
  const variantStyles = {
    default: {
      bg: "bg-surface",
      border: "border-border/80 hover:border-border",
      iconBg: "bg-bg text-text-secondary border-border/60",
      accentDot: "bg-text-secondary/40",
    },
    primary: {
      bg: "bg-surface hover:bg-action/[0.02]",
      border: "border-action/25 hover:border-action/50",
      iconBg: "bg-action/10 text-action border-action/20",
      accentDot: "bg-action",
    },
    emerald: {
      bg: "bg-surface hover:bg-emerald-500/[0.02]",
      border: "border-emerald-500/25 hover:border-emerald-500/50",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      accentDot: "bg-emerald-500",
    },
    amber: {
      bg: "bg-surface hover:bg-amber-500/[0.02]",
      border: "border-amber-500/25 hover:border-amber-500/50",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      accentDot: "bg-amber-500",
    },
    rose: {
      bg: "bg-surface hover:bg-rose-500/[0.02]",
      border: "border-rose-500/25 hover:border-rose-500/50",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      accentDot: "bg-rose-500",
    },
    violet: {
      bg: "bg-surface hover:bg-purple-500/[0.02]",
      border: "border-purple-500/25 hover:border-purple-500/50",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      accentDot: "bg-purple-500",
    },
  };

  const style = variantStyles[variant] ?? variantStyles.default;

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default ${style.bg} ${style.border}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider truncate">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-xl grid place-items-center border shrink-0 ${style.iconBg}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tabular-nums tracking-tight truncate">
          {value}
        </p>
        {trend && (
          <span
            className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
              typeof trend === "number" || (typeof trend === "string" && trend.startsWith("+"))
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="text-xs text-text-secondary mt-1 truncate">{sublabel}</p>
      )}
    </div>
  );
}
