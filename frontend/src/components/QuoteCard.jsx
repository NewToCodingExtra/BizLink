import { Link } from "@inertiajs/react";
import { XIcon } from "./icons";

export function quoteHref(q) {
  if (!q || q.expired || !q.slug) return null;
  if (q.kind === "reel") return `/reels?slug=${q.slug}`;
  if (q.kind === "story") return `/stories/${q.slug}`;
  return `/post/${q.slug}`;
}

const KIND_LABEL = { post: "Post", reel: "Reel", story: "Story" };

function CardBody({ quote, compact }) {
  const thumb = quote.videoUrl || quote.mediaUrl;
  return (
    <>
      {thumb && (
        quote.videoUrl
          ? <video src={quote.videoUrl} className={`${compact ? "w-9 h-9" : "w-12 h-12"} rounded object-cover shrink-0 bg-black`} muted />
          : <img src={thumb} alt="" className={`${compact ? "w-9 h-9" : "w-12 h-12"} rounded object-cover shrink-0 bg-bg`} />
      )}
      <div className="flex-1 min-w-0">
        <p className={`${compact ? "text-[11px]" : "text-xs"} font-semibold truncate`}>{quote.headline}</p>
        <p className="text-[10px] uppercase tracking-wider opacity-70">{KIND_LABEL[quote.kind] || quote.type}</p>
      </div>
    </>
  );
}

/**
 * Quoted post/reel/story card. Two modes:
 * - pin: full card above the composer (dismissible)
 * - inline: subordinate card above a sent bubble (translucent, indented, clickable)
 */
export default function QuoteCard({ quote, mode = "inline", onDismiss, dark = false }) {
  if (!quote) return null;
  if (quote.expired) {
    return (
      <div className="mb-2 ml-6 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-secondary italic">
        Story expired — no longer viewable.
      </div>
    );
  }
  if (mode === "pin") {
    return (
      <div className="mb-2 flex items-center gap-3 rounded-xl border border-action/30 bg-action/5 px-3 py-2">
        <CardBody quote={quote} />
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Remove quote" className="p-1 rounded-full text-text-secondary hover:bg-bg shrink-0">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
  const href = quoteHref(quote);
  const cls = `mb-2 ml-6 rounded-lg border-l-2 px-2.5 py-2 flex items-center gap-2 ${
    dark ? "border-white/40 bg-black/20" : "border-action/40 bg-black/[0.04]"
  }`;
  const body = <CardBody quote={quote} compact />;
  return href ? <Link href={href} className={`${cls} hover:opacity-90 transition-opacity`}>{body}</Link> : <div className={cls}>{body}</div>;
}
