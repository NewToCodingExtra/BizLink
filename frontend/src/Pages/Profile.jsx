import { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import OpportunityCard from "../Components/OpportunityCard";
import { CheckIcon } from "../Components/icons";
import { httpApi } from "../utils/http";
import { goInquire } from "../utils/inquire";
import { useToast } from "../context/ToastContext";

export default function Profile({
  profileUser,
  stats = { posts: 0, stories: 0 },
  following: initialFollowing = false,
  opportunities: initialOpps = [],
  stories: initialStories = [],
  savedIds: initialSavedIds = [],
  tab = "posts",
}) {
  const toast = useToast();
  const { auth, username } = usePage().props;
  const viewer = auth?.user ?? null;
  const [opps, setOpps] = useState(initialOpps || []);
  const [stories, setStories] = useState(initialStories || []);
  const [comments, setComments] = useState(() => (initialOpps || []).flatMap((o) => o.comments || []));
  const [savedIds, setSavedIds] = useState(initialSavedIds || []);
  const [following, setFollowing] = useState(!!initialFollowing);
  const [error, setError] = useState("");
  // Deep-linkable tabs: /profile/:user?tab=reels opens straight on REELS
  // (used by reel author links so the watched video is actually visible).
  const [activeTab, setActiveTab] = useState(tab === "reels" ? "reels" : "posts");

  // POSTS = the author's full feed (images AND videos).
  // REELS = the same list filtered to video posts only (tab = filter).
  const allOpps = opps;
  const reelOpps = opps.filter((o) => o.mediaType === "video");

  const switchTab = (next) => {
    setActiveTab(next);
    try {
      const url = new URL(window.location.href);
      if (next === "reels") url.searchParams.set("tab", "reels");
      else url.searchParams.delete("tab");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
    } catch {}
  };

  const toggleFollow = async () => {
    if (!viewer) {
      toast.error("Log in to follow.");
      return;
    }
    if (!profileUser) return;
    try {
      const res = await httpApi.post("/follows/toggle", { brand_id: `brand-${profileUser.id}` });
      setFollowing(!!res.following);
    } catch (err) {
      toast.error(err.message || "Follow failed");
    }
  };

  const onToggleLike = async (oppId) => {
    if (!viewer) {
      toast.error("Log in to like.");
      return;
    }
    setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await httpApi.post(`/opportunities/${oppId}/like`);
      setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      toast.error(err.message || "Like failed");
    }
  };

  const onToggleSave = async (oppId) => {
    if (!viewer) {
      toast.error("Log in to save.");
      return;
    }
    try {
      const res = await httpApi.post(`/opportunities/${oppId}/save`);
      setSavedIds((prev) => (res.saved ? [...new Set([...prev, oppId])] : prev.filter((x) => String(x) !== String(oppId))));
      setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, saved: res.saved } : o)));
    } catch (err) {
      toast.error(err.message || "Save failed");
    }
  };

  // Append-only: CommentTree already POSTed; keep local list in sync.
  const onAddComment = async ({ comment }) => {
    if (!viewer || !comment) return;
    setComments((prev) => [...prev, comment]);
  };

  if (username === "me" && !viewer) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <Head title="Profile" />
        <p className="text-text-secondary">Log in to view your profile.</p>
        <Link href="/login" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">Log in</Link>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-text-secondary">
        <Head title="Profile not found" />
        Profile not found.
      </div>
    );
  }

  const isOwn = !!viewer && String(viewer.id) === String(profileUser.id);

  return (
    <>
      <Head title={`${profileUser.name} (@${profileUser.username || username || "user"})`} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#0B1F3A] via-[#1E3A5F] to-[#2563EB]" />
          <div className="p-6 pt-0">
            <img src={profileUser.avatar} alt={profileUser.name} className="w-20 h-20 rounded-full object-cover border-4 border-white -mt-10 bg-bg" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-text-primary">{profileUser.name}</h1>
              {profileUser.username && <span className="text-sm text-text-secondary">@{profileUser.username}</span>}
              {profileUser.role === "brand" && <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success border border-success/20 rounded-full px-2 py-0.5 font-bold"><CheckIcon className="w-3 h-3" /> Brand</span>}
              {isOwn && <span className="text-xs bg-bg text-text-secondary border border-border rounded-full px-2 py-0.5">You</span>}
            </div>
            {profileUser.bio && <p className="text-sm text-text-secondary mt-2 leading-relaxed">{profileUser.bio}</p>}
            <div className="mt-3 flex gap-5 text-sm">
              <span><strong className="text-text-primary">{stats.posts}</strong> <span className="text-text-secondary">posts</span></span>
              <span><strong className="text-text-primary">{stats.stories}</strong> <span className="text-text-secondary">stories</span></span>
              <span className="text-text-secondary capitalize">{profileUser.role}</span>
            </div>
            {isOwn && (
              <Link href="/profile/edit" className="inline-block mt-4 px-5 py-1.5 rounded-full text-sm font-medium border bg-transparent text-text-primary border-text-secondary hover:bg-text-secondary/10 transition-colors">Edit profile</Link>
            )}
            {!isOwn && viewer && (
              <button onClick={toggleFollow} className={`mt-4 px-5 py-1.5 rounded-full text-sm font-medium border transition-colors ${following ? "bg-transparent text-text-primary border-text-secondary hover:bg-text-secondary/10" : "bg-action text-white border-action hover:bg-action-hover"}`}>
                {following ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        {stories.length > 0 && (
          <div className="mt-4 bg-surface rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold tracking-widest text-text-secondary">STORIES BY {profileUser.name.toUpperCase()}</p>
            <div className="mt-3 flex gap-3 overflow-auto pb-1">
              {stories.map((s) => (
                <Link key={s.id} href={`/stories/${s.slug}`} className="shrink-0 text-center group">
                  <img src={s.mediaUrl} alt={s.caption} className="w-24 h-32 rounded-xl object-cover border border-border group-hover:shadow-md transition" />
                  <span className="block mt-1 text-[11px] text-text-secondary truncate w-24">{s.caption}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center gap-6 border-b border-border mb-4 px-2">
            <button
              onClick={() => switchTab("posts")}
              className={`pb-3 text-sm font-semibold transition-colors ${activeTab === "posts" ? "text-action border-b-2 border-action" : "text-text-secondary hover:text-text-primary"}`}
            >
              POSTS
            </button>
            <button
              onClick={() => switchTab("reels")}
              className={`pb-3 text-sm font-semibold transition-colors ${activeTab === "reels" ? "text-action border-b-2 border-action" : "text-text-secondary hover:text-text-primary"}`}
            >
              REELS
            </button>
          </div>

          {activeTab === "posts" && (
            <div className="space-y-4">
              {/* POSTS shows the full feed for this author — reels included.
                  The REELS tab is just a video-only filter of the same list. */}
              {allOpps.length === 0 && (
                <div className="bg-surface rounded-xl border border-border p-8 text-center">
                  <p className="text-sm text-text-secondary">No posts yet.</p>
                </div>
              )}
              {allOpps.map((o) => (
                <OpportunityCard
                  key={o.id}
                  opp={o}
                  comments={comments}
                  onToggleLike={onToggleLike}
                  onToggleSave={onToggleSave}
                  onAddComment={onAddComment}
                  onInquire={(p) => {
                    if (!viewer) {
                      toast.error("Log in to inquire.");
                      return;
                    }
                    goInquire(toast, "opportunity", p.id);
                  }}
                  saved={savedIds.map(String).includes(String(o.id))}
                />
              ))}
              {allOpps.length > 0 && (
                <p className="text-center text-xs text-text-secondary py-2">End of {profileUser.name}&rsquo;s posts.</p>
              )}
            </div>
          )}

          {activeTab === "reels" && (
            <div className="grid grid-cols-3 gap-1">
              {reelOpps.length === 0 && (
                <div className="col-span-3 bg-surface rounded-xl border border-border p-8 text-center mt-2">
                  <p className="text-sm text-text-secondary">No reels yet.</p>
                </div>
              )}
              {reelOpps.map((o) => (
                <Link key={o.id} href={`/reels?slug=${o.slug}`} className="block aspect-[9/16] bg-bg relative group overflow-hidden">
                  {o.videoUrl ? (
                    <video
                      src={o.videoUrl}
                      poster={o.image || undefined}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <img src={o.image || o.brandAvatar} alt={o.headline} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-[var(--color-text-primary)] font-bold flex items-center gap-1">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      {o.likes}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
