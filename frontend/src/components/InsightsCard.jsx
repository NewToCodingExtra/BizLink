import { format } from "date-fns";

export default function InsightsCard({ insight, dark = false }) {
  if (!insight) return null;

  return (
    <div className={`rounded-xl border px-3 py-3 ${dark ? "border-white/20 bg-white/10" : "border-border bg-bg"}`}>
      <div className={`text-xs uppercase tracking-wider mb-2 font-bold opacity-70 ${dark ? "text-white" : "text-text-secondary"}`}>
        Brand Analytics Snapshot
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className={`rounded-lg p-2 ${dark ? "bg-black/20" : "bg-surface shadow-sm"}`}>
          <div className={`text-[10px] uppercase opacity-70 ${dark ? "text-white" : "text-text-secondary"}`}>Total Posts</div>
          <div className={`text-lg font-semibold ${dark ? "text-white" : "text-text-primary"}`}>{insight.postsCount ?? 0}</div>
        </div>
        <div className={`rounded-lg p-2 ${dark ? "bg-black/20" : "bg-surface shadow-sm"}`}>
          <div className={`text-[10px] uppercase opacity-70 ${dark ? "text-white" : "text-text-secondary"}`}>Inquiries</div>
          <div className={`text-lg font-semibold ${dark ? "text-white" : "text-text-primary"}`}>{insight.inquiriesCount ?? 0}</div>
        </div>
        <div className={`rounded-lg p-2 col-span-2 ${dark ? "bg-black/20" : "bg-surface shadow-sm"}`}>
          <div className={`text-[10px] uppercase opacity-70 ${dark ? "text-white" : "text-text-secondary"}`}>Total Likes</div>
          <div className={`text-lg font-semibold ${dark ? "text-white" : "text-text-primary"}`}>{insight.likesTotal ?? 0}</div>
        </div>
      </div>
      {insight.topPost && (
        <div className={`rounded-lg p-2 ${dark ? "bg-black/20" : "bg-surface shadow-sm"}`}>
          <div className={`text-[10px] uppercase opacity-70 mb-1 ${dark ? "text-white" : "text-text-secondary"}`}>Top Performer</div>
          <div className={`text-sm truncate font-medium ${dark ? "text-white" : "text-text-primary"}`}>{insight.topPost.headline}</div>
          <div className={`text-[10px] md:text-xs mt-0.5 ${dark ? "text-white/70" : "text-text-secondary"}`}>{insight.topPost.likes} likes</div>
        </div>
      )}
      <div className={`mt-2 text-[10px] text-right opacity-60 ${dark ? "text-white" : "text-text-secondary"}`}>
        As of {insight.asOf ? format(new Date(insight.asOf), "MMM d, yyyy h:mm a") : "just now"}
      </div>
    </div>
  );
}
