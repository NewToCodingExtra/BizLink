import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import OpportunityCard from "../components/OpportunityCard";
import ContactForm from "../components/ContactForm";
import { FeedSkeleton, ProfileHeaderSkeleton } from "../components/Skeleton";
import { followsApi, inboxApi, opportunitiesApi, usersApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { id } = useParams();
  const { user: viewer } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [opps, setOpps] = useState([]);
  const [stories, setStories] = useState([]);
  const [stats, setStats] = useState({ posts: 0, stories: 0 });
  const [comments, setComments] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resolvedId = id === "me" ? (viewer ? String(viewer.id) : null) : id;

  useEffect(() => {
    if (id === "me" && !viewer) {
      setLoading(false);
      return;
    }
    if (!resolvedId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    usersApi
      .get(resolvedId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setProfileUser(data.user);
        setStats(data.stats || { posts: 0, stories: 0 });
        setFollowing(!!data.following);
        setOpps(data.opportunities || []);
        setStories(data.stories || []);
        setComments((data.opportunities || []).flatMap((o) => o.comments || []));
        setSavedIds((data.opportunities || []).filter((o) => o.saved).map((o) => o.id));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedId, id, viewer]);

  const toggleFollow = async () => {
    if (!viewer) {
      setError("Log in to follow.");
      return;
    }
    if (!profileUser) return;
    try {
      const res = await followsApi.toggle(`brand-${profileUser.id}`);
      setFollowing(res.following);
    } catch (err) {
      setError(err.message || "Follow failed");
    }
  };

  const onToggleLike = async (oppId) => {
    if (!viewer) {
      setError("Log in to like.");
      return;
    }
    setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(oppId);
      setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async (oppId) => {
    if (!viewer) {
      setError("Log in to save.");
      return;
    }
    try {
      const res = await opportunitiesApi.toggleSave(oppId);
      setSavedIds((prev) => (res.saved ? [...new Set([...prev, oppId])] : prev.filter((x) => String(x) !== String(oppId))));
      setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, saved: res.saved } : o)));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    if (!viewer) return;
    const res = await opportunitiesApi.addComment(postId, text);
    setComments((prev) => [...prev, res.data]);
  };

  if (id === "me" && !viewer) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-500">Log in to view your profile.</p>
        <Link to="/login" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium">Log in</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <ProfileHeaderSkeleton />
        <FeedSkeleton count={2} />
      </div>
    );
  }

  if (error && !profileUser) {
    return <div className="max-w-2xl mx-auto py-12 px-4 text-center text-slate-500">{error}</div>;
  }

  if (!profileUser) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">Profile not found.</div>;
  }

  const isOwn = viewer && String(viewer.id) === String(profileUser.id);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {error && <p className="mb-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0B1F3A] via-[#1E3A5F] to-[#2563EB]" />
        <div className="p-6 pt-0">
          <img src={profileUser.avatar} alt={profileUser.name} className="w-20 h-20 rounded-full object-cover border-4 border-white -mt-10 bg-slate-100" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-[#0B1F3A]">{profileUser.name}</h1>
            {profileUser.role === "brand" && <span className="text-xs bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-2 py-0.5 font-bold">✓ Brand</span>}
            {isOwn && <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">You</span>}
          </div>
          <div className="mt-3 flex gap-5 text-sm">
            <span><strong className="text-slate-900">{stats.posts}</strong> <span className="text-slate-500">posts</span></span>
            <span><strong className="text-slate-900">{stats.stories}</strong> <span className="text-slate-500">stories</span></span>
            <span className="text-slate-500 capitalize">{profileUser.role}</span>
          </div>
          {!isOwn && viewer && (
            <button onClick={toggleFollow} className={`mt-4 px-5 py-1.5 rounded-full text-sm font-medium border transition-colors ${following ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {stories.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold tracking-widest text-slate-400">STORIES BY {profileUser.name.toUpperCase()}</p>
          <div className="mt-3 flex gap-3 overflow-auto pb-1">
            {stories.map((s) => (
              <Link key={s.id} to={`/stories/${s.id}`} className="shrink-0 text-center group">
                <img src={s.mediaUrl} alt={s.caption} className="w-24 h-32 rounded-xl object-cover border border-slate-100 group-hover:shadow-md transition" />
                <span className="block mt-1 text-[11px] text-slate-500 truncate w-24">{s.caption}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest text-slate-400">POSTS BY {profileUser.name.toUpperCase()}</h2>
        {opps.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
            <p className="text-sm text-slate-500">No posts yet.</p>
          </div>
        )}
        {opps.map((o) => (
          <OpportunityCard
            key={o.id}
            opp={o}
            comments={comments}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
            onAddComment={onAddComment}
            onInquire={(p) => {
              if (!viewer) {
                setError("Log in to inquire.");
                return;
              }
              setSelectedPost(p);
              setIsModalOpen(true);
            }}
            saved={savedIds.map(String).includes(String(o.id))}
          />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B1F3A]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto">
            <ContactForm
              prefill={selectedPost}
              onClose={() => setIsModalOpen(false)}
              onSubmit={async ({ message }) => {
                await inboxApi.inquire({ opportunity_id: selectedPost.id, message });
                setIsModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
