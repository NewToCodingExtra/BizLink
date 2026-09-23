import { useEffect, useMemo, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import OpportunityCard from "../Components/OpportunityCard";
import ContactForm from "../Components/ContactForm";
import Modal from "../Components/Modal";
import { OpportunityCardSkeleton } from "../Components/Skeleton";
import ProgressBar from "../Components/ProgressBar";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";

function appendById(prev, incoming) {
  const seen = new Set(prev.map((o) => String(o.id)));
  const fresh = (incoming || []).filter((o) => !seen.has(String(o.id)));
  return [...prev, ...fresh];
}

export default function Search({ opportunities, q: serverQ }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const user = auth?.user ?? null;

  const q = serverQ ?? "";
  const initialData = opportunities?.data ?? [];
  const meta = opportunities?.meta ?? {};
  const currentPage = meta.current_page ?? 1;
  const lastPage = meta.last_page ?? 1;
  const total = meta.total ?? initialData.length;
  const hasMore = currentPage < lastPage;

  const [input, setInput] = useState(q);
  const [results, setResults] = useState(initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const data = opportunities?.data ?? [];
    const page = opportunities?.meta?.current_page ?? 1;
    if (page <= 1) setResults(data);
    else setResults((prev) => appendById(prev, data));
    setLoadingMore(false);
  }, [opportunities]);

  useEffect(() => setInput(q), [q]);

  // Debounced search → full prop refresh (SearchBar onSearch equivalent).
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) {
        router.get("/search", input ? { q: input } : {}, { preserveState: true, preserveScroll: true, replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    router.get("/search", { q, page: currentPage + 1 }, {
      preserveState: true,
      preserveScroll: true,
      only: ["opportunities"],
      onSuccess: (page) => {
        const incoming = page?.props?.opportunities?.data ?? [];
        setResults((prev) => appendById(prev, incoming));
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
  }, [hasMore, currentPage, q]);

  const comments = useMemo(() => results.flatMap((o) => o.comments || []), [results]);
  const savedIds = useMemo(() => results.filter((o) => o.saved).map((o) => o.id), [results]);

  const onToggleLike = async (id) => {
    if (!user) {
      toast.error("Log in to like opportunities.");
      return;
    }
    setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await httpApi.post(`/opportunities/${id}/like`);
      setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked ?? o.liked, likes: res.likes_count ?? o.likes } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async (id) => {
    if (!user) {
      toast.error("Log in to save opportunities.");
      return;
    }
    try {
      const res = await httpApi.post(`/opportunities/${id}/save`);
      setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, saved: res.saved } : o)));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    if (!user) return;
    try {
      const res = await httpApi.post(`/opportunities/${postId}/comments`, { text });
      const comment = res?.data ?? res;
      setResults((prev) =>
        prev.map((o) => (String(o.id) === String(postId) ? { ...o, comments: [...(o.comments || []), comment] } : o))
      );
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  };

  const onInquire = (opp) => {
    if (!user) {
      toast.error("Log in to inquire.");
      return;
    }
    setSelectedPost(opp);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title={q ? `Search · ${q}` : "Search"} />
      <h1 className="text-2xl font-semibold text-primary">Search</h1>
      <div className="mt-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg>
        </span>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search brands, categories..." className="w-full border border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg pl-9 pr-4 py-3 text-sm bg-surface" />
      </div>

      {error && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}

      {!q ? (
        <p className="text-sm text-text-secondary mt-6">Type to search franchises, wholesale and resell opportunities.</p>
      ) : results.length === 0 && total === 0 && !loadingMore ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center mt-6">
          <p className="text-sm text-text-secondary">No opportunities match “{q}” — try a broader term.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {refreshing && <ProgressBar ariaLabel="Refreshing results" />}
          <p className="text-sm text-text-secondary">{(hasMore || loadingMore) ? `Showing ${results.length} of ${total} result${total !== 1 ? "s" : ""}` : `${total} result${total !== 1 ? "s" : ""}`} for “{q}”</p>
          {results.map((o) => (
            <OpportunityCard key={o.id} opp={o} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.map(String).includes(String(o.id))} />
          ))}
          {loadingMore && (
            <>
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
            </>
          )}
          <div ref={sentinelRef} aria-hidden="true" className="h-2" />
          {!hasMore && !loadingMore && <p className="text-center text-xs text-text-secondary py-2">End of results.</p>}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-lg"
      >
        <ContactForm
          prefill={selectedPost}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async ({ message }) => {
            await httpApi.post("/inquiries", { opportunity_id: selectedPost.id, message });
            setIsModalOpen(false);
            toast.success("Inquiry sent.");
          }}
          compact
        />
      </Modal>
    </div>
  );
}

