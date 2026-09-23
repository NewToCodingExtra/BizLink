import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import StoriesBar from "../Components/StoriesBar";
import OpportunityFeed from "../Components/OpportunityFeed";
import CreateStoryModal from "../Components/CreateStoryModal";
import { FeedSkeleton, StoriesBarSkeleton } from "../Components/Skeleton";
import { httpApi } from "../utils/http";
import { goInquire } from "../utils/inquire";
import { useToast } from "../context/ToastContext";

function appendById(prev, incoming) {
  const seen = new Set(prev.map((o) => String(o.id)));
  const fresh = (incoming || []).filter((o) => !seen.has(String(o.id)));
  return [...prev, ...fresh];
}

export default function HomeFeed({ opportunities, stories, preferences }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const toast = useToast();

  const initialData = opportunities?.data ?? [];
  const meta = opportunities?.meta ?? {};
  const currentPage = meta.current_page ?? 1;
  const lastPage = meta.last_page ?? 1;
  const total = meta.total ?? initialData.length;
  const hasMore = currentPage < lastPage;

  const [items, setItems] = useState(initialData);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const sentinelRef = useRef(null);

  // Sync server props: page 1 replaces, later pages append by id.
  useEffect(() => {
    const data = opportunities?.data ?? [];
    const page = opportunities?.meta?.current_page ?? 1;
    if (page <= 1) {
      setItems(data);
    } else {
      setItems((prev) => appendById(prev, data));
    }
    setLoadingMore(false);
  }, [opportunities]);

  // Story creation modal opens via window event (StoriesBar "Create" button).
  useEffect(() => {
    window.onOpenCreateStory = () => setIsCreateStoryOpen(true);
    return () => {
      delete window.onOpenCreateStory;
    };
  }, []);

  // Hide (Not Interested) — same window contract as SPA.
  useEffect(() => {
    window.onHideOpp = async (id) => {
      try {
        await httpApi.post(`/opportunities/${id}/hide`);
        setItems((prev) => prev.filter((o) => String(o.id) !== String(id)));
      } catch (err) {
        toast.error("Failed to hide opportunity.");
      }
    };
    return () => {
      delete window.onHideOpp;
    };
  }, []);

  // NOTE: no auto "Personalized for you" toast here. It is shown only at
  // the moment preferences are set up / changed (onboarding modal +
  // Preferences page), never on plain feed visits or reloads.

  const handleFilterChange = (next) => {
    setActiveFilter(next);
    router.get("/feed", next === "All" ? {} : { type: next }, { preserveState: true, preserveScroll: true });
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = currentPage + 1;
    const params = { page: next };
    if (activeFilter !== "All") params.type = activeFilter;
    router.get("/feed", params, {
      preserveState: true,
      preserveScroll: true,
      only: ["opportunities"],
      onSuccess: (page) => {
        const incoming = page?.props?.opportunities?.data ?? [];
        setItems((prev) => appendById(prev, incoming));
        setLoadingMore(false);
      },
      onError: () => setLoadingMore(false),
      onFinish: () => setLoadingMore(false),
    });
  };

  // Infinite scroll sentinel.
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
  }, [hasMore, currentPage, activeFilter]);

  const comments = useMemo(() => items.flatMap((o) => o.comments || []), [items]);
  const savedIds = useMemo(() => items.filter((o) => o.saved).map((o) => o.id), [items]);

  const onToggleLike = async (id) => {
    if (!user) {
      toast.error("Log in to like opportunities.");
      return;
    }
    setItems((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await httpApi.post(`/opportunities/${id}/like`);
      setItems((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked ?? !o.liked, likes: res.likes_count ?? o.likes } : o)));
    } catch {
      toast.error("Like failed. Try again.");
    }
  };

  const onToggleSave = async (id) => {
    if (!user) {
      toast.error("Log in to save opportunities.");
      return;
    }
    try {
      const res = await httpApi.post(`/opportunities/${id}/save`);
      setItems((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, saved: res.saved, saves: res.saves_count ?? o.saves } : o)));
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  };

  // Append-only: CommentTree already POSTed; keep local lists in sync.
  const onAddComment = async ({ postId, comment }) => {
    if (!user || !comment) return;
    setItems((prev) =>
      prev.map((o) => (String(o.id) === String(postId) ? { ...o, comments: [...(o.comments || []), comment] } : o))
    );
  };

  // Inquire goes straight to the private thread with the post pinned as a quote.
  const onInquire = (opp) => {
    if (!user) {
      toast.error("Log in to inquire. Your message will open a private consultation thread.");
      return;
    }
    goInquire(toast, "opportunity", opp.id);
  };

  return (
    <div>
      <Head title="Feed" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!user && (
          <div className="mb-4 bg-warning/10 border border-amber-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-warning flex-1 min-w-[200px]">Browsing as guest — feed is live from Laravel + MySQL. Log in to like, save, comment and inquire.</p>
            <Link href="/login" className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium">Log in</Link>
            <Link href="/" className="px-4 py-1.5 rounded-lg bg-surface border border-amber-200 text-warning text-sm font-medium">About BizLink</Link>
          </div>
        )}
        {opportunities === undefined ? (
          <>
            <StoriesBarSkeleton />
            <FeedSkeleton count={3} />
          </>
        ) : (
          <>
            {stories === undefined ? <StoriesBarSkeleton /> : <StoriesBar stories={stories ?? []} />}
            <OpportunityFeed
              opportunities={items}
              comments={comments}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              setActiveFilter={handleFilterChange}
              savedIds={savedIds}
              onToggleLike={onToggleLike}
              onToggleSave={onToggleSave}
              onAddComment={onAddComment}
              onInquire={onInquire}
              serverFiltered
              loadingMore={loadingMore}
              refreshing={false}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              total={total}
              onLoadMore={handleLoadMore}
            />
          </>
        )}
      </div>

      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onComplete={() => router.reload({ only: ["stories"] })}
      />
    </div>
  );
}

