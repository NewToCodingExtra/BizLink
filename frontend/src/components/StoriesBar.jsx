import { useEffect, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";

function expiryOf(s) {
  if (!s) return 0;
  const v = s.expiresAt;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

export default function StoriesBar({ stories }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;

  const scrollRef = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const active = (stories || []).filter((s) => expiryOf(s) > Date.now());

  const grouped = [];
  const seenBrands = new Set();
  for (const s of active) {
    if (!seenBrands.has(s.brandId)) {
      seenBrands.add(s.brandId);
      grouped.push(s);
    }
  }

  // Edge fades replace the scrollbar: they whisper "there's more" in palette.
  // NOTE: never setState inside the ref callback itself — that re-attaches
  // every render and loops ("Too many re-renders" white-out). Observe instead.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const next = {
        left: el.scrollLeft > 8,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
      };
      setEdge((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [grouped.length]);

  if (active.length === 0 && !user) return null;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm p-4 mb-4 max-w-2xl mx-auto">
      <p className="text-xs font-semibold tracking-widest text-text-secondary">DAILY OPPORTUNITIES</p>
      <div className="mt-3 flex items-stretch gap-3">
        {/* Create Story Button — pinned, never scrolls */}
        <button
          onClick={() => {
            if (window.onOpenCreateStory) window.onOpenCreateStory();
          }}
          className="shrink-0 text-center group flex flex-col items-center self-start"
        >
          <span className="relative flex items-center justify-center w-[68px] h-[68px] rounded-full border border-border bg-bg group-hover:bg-bg transition p-0.5">
            {user ? (
              <img src={user.avatar || `https://i.pravatar.cc/100?u=${user.id}`} alt="Create Story" className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition" />
            ) : (
              <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            )}
            <div className="absolute bottom-0 right-0 bg-action text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </div>
          </span>
          <span className="block mt-1.5 text-xs font-medium text-text-primary truncate w-[68px]">Create</span>
        </button>

        {/* Separator between composer and real stories */}
        {grouped.length > 0 && (
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-border to-transparent" aria-hidden="true" />
        )}

        {/* Real stories only — the sole scrollable region, scrollbar hidden */}
        {grouped.length > 0 && (
          <div className="relative flex-1 min-w-0">
            <div
              ref={scrollRef}
              onWheel={(e) => {
                const el = scrollRef.current;
                if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  el.scrollLeft += e.deltaY;
                }
              }}
              className="no-scrollbar flex gap-4 overflow-x-auto pb-1 pt-0.5 px-0.5 items-start"
            >
              {grouped.map((s) => (
                <Link key={s.id} href={`/stories/${s.id}`} className="shrink-0 text-center group flex flex-col items-center">
                  <span className={`block w-[68px] h-[68px] rounded-full p-[3px] ${s.seen ? "bg-bg" : "bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500"}`}>
                    <img src={s.avatar} alt={s.brandName} className="w-full h-full rounded-full object-cover border-2 border-white group-hover:scale-[1.02] transition" />
                  </span>
                  <span className="block mt-1.5 text-xs font-medium text-text-primary truncate w-[68px]">{s.brandName}</span>
                </Link>
              ))}
            </div>
            {/* Edge fades in card palette instead of a scrollbar */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${edge.left ? "opacity-100" : "opacity-0"}`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${edge.right ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
