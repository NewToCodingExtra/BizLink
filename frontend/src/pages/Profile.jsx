import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import OpportunityCard from "../components/OpportunityCard";
import ContactForm from "../components/ContactForm";
import Modal from "../components/Modal";
import { FeedSkeleton, ProfileHeaderSkeleton } from "../components/Skeleton";
import { followsApi, inboxApi, opportunitiesApi, usersApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [activeTab, setActiveTab] = useState("posts"); // "posts" or "reels"

  const resolvedId = username === "me" ? (viewer ? String(viewer.id) : null) : username;

  useEffect(() => {
    if (username === "me" && !viewer) {
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
        // Canonicalize legacy id / brand-slug URLs to the username path.
        if (data.user?.username && username !== "me" && username !== data.user.username) {
          navigate(`/profile/${data.user.username}`, { replace: true });
        }
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
  }, [resolvedId, username, viewer, navigate]);

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

  if (username === "me" && !viewer) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-text-secondary">Log in to view your profile.</p>
        <Link to="/login" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">Log in</Link>
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
    return <div className="max-w-2xl mx-auto py-12 px-4 text-center text-text-secondary">{error}</div>;
  }

  if (!profileUser) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-text-secondary">Profile not found.</div>;
  }

  const isOwn = viewer && String(viewer.id) === String(profileUser.id);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {error && <p className="mb-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0B1F3A] via-[#1E3A5F] to-[#2563EB]" />
        <div className="p-6 pt-0">
          <img src={profileUser.avatar} alt={profileUser.name} className="w-20 h-20 rounded-full object-cover border-4 border-white -mt-10 bg-bg" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">{profileUser.name}</h1>
            {profileUser.username && <span className="text-sm text-text-secondary">@{profileUser.username}</span>}
            {profileUser.role === "brand" && <span className="text-xs bg-success/10 text-success border border-success/20 rounded-full px-2 py-0.5 font-bold">✓ Brand</span>}
            {isOwn && <span className="text-xs bg-bg text-text-secondary border border-border rounded-full px-2 py-0.5">You</span>}
          </div>
          {profileUser.bio && <p className="text-sm text-text-secondary mt-2 leading-relaxed">{profileUser.bio}</p>}
          <div className="mt-3 flex gap-5 text-sm">
            <span><strong className="text-text-primary">{stats.posts}</strong> <span className="text-text-secondary">posts</span></span>
            <span><strong className="text-text-primary">{stats.stories}</strong> <span className="text-text-secondary">stories</span></span>
            <span className="text-text-secondary capitalize">{profileUser.role}</span>
          </div>
          {isOwn && (
            <Link to="/profile/edit" className="inline-block mt-4 px-5 py-1.5 rounded-full text-sm font-medium border bg-transparent text-text-primary border-text-secondary hover:bg-text-secondary/10 transition-colors">Edit profile</Link>
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
              <Link key={s.id} to={`/stories/${s.id}`} state={{ fromProfile: true, backgroundLocation: location }} className="shrink-0 text-center group">
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
            onClick={() => setActiveTab("posts")} 
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === "posts" ? "text-action border-b-2 border-action" : "text-text-secondary hover:text-text-primary"}`}
          >
            POSTS
          </button>
          <button 
            onClick={() => setActiveTab("reels")} 
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === "reels" ? "text-action border-b-2 border-action" : "text-text-secondary hover:text-text-primary"}`}
          >
            REELS
          </button>
        </div>

        {activeTab === "posts" && (
          <div className="space-y-4">
            {opps.filter(o => o.mediaType !== "video").length === 0 && (
              <div className="bg-surface rounded-xl border border-border p-8 text-center">
                <p className="text-sm text-text-secondary">No posts yet.</p>
              </div>
            )}
            {opps.filter(o => o.mediaType !== "video").map((o) => (
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
            {opps.filter(o => o.mediaType !== "video").length > 0 && (
              <p className="text-center text-xs text-text-secondary py-2">End of {profileUser.name}&rsquo;s posts.</p>
            )}
          </div>
        )}

        {activeTab === "reels" && (
          <div className="grid grid-cols-3 gap-1">
            {opps.filter(o => o.mediaType === "video").length === 0 && (
              <div className="col-span-3 bg-surface rounded-xl border border-border p-8 text-center mt-2">
                <p className="text-sm text-text-secondary">No reels yet.</p>
              </div>
            )}
            {opps.filter(o => o.mediaType === "video").map((o) => (
              <Link key={o.id} to={`/reels?id=${o.id}`} className="aspect-[9/16] bg-bg relative group overflow-hidden">
                <img src={o.image || o.brandAvatar} alt={o.headline} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        maxWidth="max-w-lg"
      >
        <ContactForm
          prefill={selectedPost}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async ({ message }) => {
            await inboxApi.inquire({ opportunity_id: selectedPost.id, message });
            setIsModalOpen(false);
          }}
          compact
        />
      </Modal>
    </div>
  );
}
