import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import OpportunityCard from "../components/OpportunityCard";
import ContactForm from "../components/ContactForm";
import { followsApi, inboxApi, opportunitiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [opps, setOpps] = useState([]);
  const [comments, setComments] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    opportunitiesApi
      .list({ per_page: 50 })
      .then((res) => {
        if (cancelled) return;
        const data = (res.data || []).filter((o) => String(o.brandId) === String(id) || (id === "me" && user && o.brandName === user.name));
        setOpps(data);
        setComments((res.data || []).flatMap((o) => o.comments || []));
        setSavedIds((res.data || []).filter((o) => o.saved).map((o) => o.id));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    if (user && id !== "me") {
      followsApi
        .list()
        .then((res) => {
          if (!cancelled) setFollowing((res.data || []).map(String).includes(String(id)));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) {
      setError("Log in to follow brands.");
      return;
    }
    try {
      const res = await followsApi.toggle(id);
      setFollowing(res.following);
    } catch (err) {
      setError(err.message || "Follow failed");
    }
  };

  const onToggleLike = async (oppId) => {
    if (!user) return;
    setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    const res = await opportunitiesApi.toggleLike(oppId);
    setOpps((prev) => prev.map((o) => (String(o.id) === String(oppId) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
  };

  const onToggleSave = async (oppId) => {
    if (!user) return;
    const res = await opportunitiesApi.toggleSave(oppId);
    setSavedIds((prev) => (res.saved ? [...new Set([...prev, oppId])] : prev.filter((x) => String(x) !== String(oppId))));
  };

  const onAddComment = async ({ postId, text }) => {
    const res = await opportunitiesApi.addComment(postId, text);
    setComments((prev) => [...prev, res.data]);
  };

  const brand = opps[0];

  if (loading) return <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">Loading profile...</div>;
  if (!brand) return <div className="max-w-2xl mx-auto py-12 text-center text-slate-500">Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {error && <p className="mb-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex gap-4">
        <img src={brand.brandAvatar} alt={brand.brandName} className="w-16 h-16 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[#0B1F3A] flex items-center gap-2">{brand.brandName} {brand.verified && <span className="text-xs bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-2 py-0.5">✓ Verified</span>}</h1>
          <p className="text-sm text-slate-500 mt-1">{brand.category} · {opps.length} opportunit{opps.length !== 1 ? "ies" : "y"}</p>
          {id !== "me" && (
            <button onClick={toggleFollow} className={`mt-3 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${following ? "bg-[#0B1F3A] text-white border-[#0B1F3A]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}>{following ? "Following" : "Follow"}</button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest text-slate-400">POSTS BY THIS BRAND</h2>
        {opps.map((o) => (
          <OpportunityCard
            key={o.id}
            opp={o}
            comments={comments}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
            onAddComment={onAddComment}
            onInquire={(p) => {
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
