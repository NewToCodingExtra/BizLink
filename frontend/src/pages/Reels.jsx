import { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import ReelCard from "../Components/ReelCard";
import CommentThread from "../Components/CommentThread";
import ContactForm from "../Components/ContactForm";
import Modal from "../Components/Modal";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";

function appendById(prev, incoming) {
  const seen = new Set(prev.map((o) => String(o.id)));
  const fresh = (incoming || []).filter((o) => !seen.has(String(o.id)));
  return [...prev, ...fresh];
}

export default function Reels({ opportunities, slug = "" }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const targetSlug = (slug || "").trim();

  const initialData = opportunities?.data ?? [];
  const meta = opportunities?.meta ?? {};
  const currentPage = meta.current_page ?? 1;
  const lastPage = meta.last_page ?? 1;
  const hasMore = currentPage < lastPage;

  const [reels, setReels] = useState(initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [commentOpp, setCommentOpp] = useState(null);
  const [highlightSlug, setHighlightSlug] = useState("");
  const sentinelRef = useRef(null);

  useEffect(() => {
    const data = opportunities?.data ?? [];
    const page = opportunities?.meta?.current_page ?? 1;
    if (page <= 1) setReels(data);
    else setReels((prev) => appendById(prev, data));
    setLoadingMore(false);
  }, [opportunities]);

  useEffect(() => {
    window.onHideOpp = async (id) => {
      try {
        await httpApi.post(`/opportunities/${id}/hide`);
        setReels((prev) => prev.filter((o) => String(o.id) !== String(id)));
      } catch {
        setError("Failed to hide reel.");
      }
    };
    return () => {
      delete window.onHideOpp;
    };
  }, []);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const params = { page: currentPage + 1 };
    if (targetSlug) params.slug = targetSlug; // keep deep-link while paging
    router.get("/reels", params, {
      preserveState: true,
      preserveScroll: true,
      only: ["opportunities"],
      onSuccess: (page) => {
        const incoming = page?.props?.opportunities?.data ?? [];
        setReels((prev) => appendById(prev, incoming));
        setLoadingMore(false);
      },
      onError: () => setLoadingMore(false),
      onFinish: () => setLoadingMore(false),
    });
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore();
      },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, currentPage]);

  const targetFound = targetSlug ? reels.some((r) => r.slug === targetSlug) : true;
  const targetMissing = targetSlug ? !targetFound && !hasMore && !loadingMore : false;

  // Deep-link (/reels?slug=...) from profile reels grids: keep paging until
  // the requested reel is loaded (or the feed is exhausted).
  useEffect(() => {
    if (!targetSlug || targetFound || !hasMore || loadingMore) return;
    handleLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSlug, targetFound, hasMore, loadingMore, reels]);

  // Deep-link: scroll the requested reel into view and flash a highlight.
  useEffect(() => {
    if (!targetSlug || !targetFound) return;
    const t = setTimeout(() => {
      document.getElementById(`reel-${targetSlug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightSlug(targetSlug);
      setTimeout(() => setHighlightSlug(""), 2600);
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSlug, targetFound]);

  const onToggleLike = async (id) => {
    if (!user) {
      toast.error("Log in to like reels.");
      return;
    }
    setReels((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: (o.likes ?? 0) + (!o.liked ? 1 : -1) } : o)));
    try {
      const res = await httpApi.post(`/opportunities/${id}/like`);
      setReels((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked ?? o.liked, likes: res.likes_count ?? o.likes } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  if (reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-text-secondary">No pitch reels yet — post a video opportunity.</p></div>;

  return (
    <div className="relative">
      <Head title="Reels" />
      {error && <p className="mx-auto max-w-md mt-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      {targetMissing && <p className="mx-auto max-w-md mt-3 text-sm text-text-secondary bg-surface border border-border rounded-lg px-3 py-2">That reel isn&apos;t available — showing all reels.</p>}
      <div className="h-[calc(100dvh-64px)] overflow-y-scroll snap-y snap-mandatory bg-black">
        {reels.map((r) => (
          <div key={r.id} id={`reel-${r.slug}`} className={`snap-start ${highlightSlug === r.slug ? "outline outline-4 outline-action" : ""}`}>
            <ReelCard
              opp={r}
              onToggleLike={onToggleLike}
              onInquire={(o) => (user ? setSelected(o) : toast.error("Log in to inquire."))}
              onOpenComments={(o) => (user ? setCommentOpp(o) : toast.error("Log in to comment."))}
            />
          </div>
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="snap-start h-[100dvh] w-full bg-black grid place-items-center">
            <div className="text-center px-6 max-w-md">
              <div className="w-8 h-8 border-4 border-slate-500 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-[var(--color-text-primary)] font-semibold mt-4">Loading more...</p>
              <button onClick={handleLoadMore} className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium">Load more</button>
            </div>
          </div>
        )}
        {!hasMore && reels.length > 0 && (
          <div className="snap-start h-[100dvh] w-full bg-black grid place-items-center">
            <div className="text-center px-6 max-w-md">
              <span className="mx-auto w-12 h-12 rounded-full bg-surface/10 grid place-items-center text-accent text-xl">✓</span>
              <p className="text-[var(--color-text-primary)] font-semibold mt-4">You're all caught up</p>
              <p className="text-[var(--color-text-primary)]/60 text-sm mt-1">You watched all {reels.length} pitch reel{reels.length !== 1 ? "s" : ""}. New pitches land here first.</p>
              <Link href="/feed" className="inline-block mt-5 px-5 py-2.5 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors">Back to feed</Link>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="max-w-lg"
      >
        <ContactForm
          prefill={selected}
          onClose={() => setSelected(null)}
          onSubmit={async ({ message }) => {
            await httpApi.post("/inquiries", { opportunity_id: selected.id, message });
            setSelected(null);
            toast.success("Inquiry sent.");
          }}
          compact
        />
      </Modal>

      <Modal
        isOpen={!!commentOpp}
        onClose={() => setCommentOpp(null)}
        maxWidth="max-w-2xl"
      >
        <div className="bg-surface rounded-2xl w-full h-[80vh] flex flex-col">
          <div className="p-4 border-b border-border flex justify-between items-center bg-bg sticky top-0 z-10">
            <h3 className="text-lg font-semibold text-text-primary">Comments · {commentOpp?.headline}</h3>
            <button onClick={() => setCommentOpp(null)} className="w-8 h-8 grid place-items-center rounded-full border border-border text-text-secondary hover:bg-surface">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <CommentThread
              postId={commentOpp?.id}
              comments={(reels.find((r) => String(r.id) === String(commentOpp?.id))?.comments) || []}
              onAdd={async ({ text }) => {
                const res = await httpApi.post(`/opportunities/${commentOpp.id}/comments`, { text });
                const comment = res?.data ?? res;
                setReels((prev) =>
                  prev.map((o) =>
                    String(o.id) === String(commentOpp.id)
                      ? { ...o, comments: [...(o.comments || []), comment], commentsCount: (typeof o.commentsCount === "number" ? o.commentsCount : (o.comments || []).length) + 1 }
                      : o
                  )
                );
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
