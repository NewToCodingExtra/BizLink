import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import CommentThread from "../components/CommentThread";
import ContactForm from "../components/ContactForm";
import Modal from "../components/Modal";
import { OpportunityDetailSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-amber-50 text-amber-700 border-amber-100";
  if (type === "Wholesale") return "bg-bg text-text-primary border-border";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opp, setOpp] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    opportunitiesApi
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setOpp(res.data);
        setComments(res.data.comments || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load opportunity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onToggleLike = async () => {
    if (!user || !opp) return;
    setOpp({ ...opp, liked: !opp.liked, likes: opp.liked ? opp.likes - 1 : opp.likes + 1 });
    try {
      const res = await opportunitiesApi.toggleLike(opp.id);
      setOpp((prev) => ({ ...prev, liked: res.liked, likes: res.likes_count }));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async () => {
    if (!user || !opp) return;
    try {
      const res = await opportunitiesApi.toggleSave(opp.id);
      setOpp((prev) => ({ ...prev, saved: res.saved, saves: res.saves_count }));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ text }) => {
    if (!user || !opp) return;
    const res = await opportunitiesApi.addComment(opp.id, text);
    setComments((prev) => [...prev, res.data]);
  };

  if (loading) return <OpportunityDetailSkeleton />;
  if (error && !opp) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-text-secondary">{error}</p><Link to="/feed" className="text-action text-sm font-medium">Back to feed</Link></div>;
  if (!opp) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-text-secondary">Opportunity not found.</p><Link to="/feed" className="text-action text-sm font-medium">Back to feed</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => navigate(-1)} className="text-sm text-text-secondary hover:text-text-primary">← Back</button>
      {error && <p className="mt-3 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <article className="mt-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <img src={opp.image} alt={opp.headline} className="w-full h-[360px] object-cover" />
        <div className="p-6">
          <div className="flex items-center gap-2">
            <img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 rounded-full" />
            <span className="text-sm font-semibold text-text-primary">{opp.brandName}</span>
            {opp.verified && <span className="text-xs font-bold text-[#16A34A] bg-green-50 border border-green-100 rounded-full px-2 py-0.5">✓ Verified</span>}
            <span className={`ml-auto text-xs font-medium border rounded-full px-2.5 py-1 ${badgeClasses(opp.type)}`}>{opp.type}</span>
          </div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight mt-4">{opp.headline}</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{opp.description}</p>
          <div className="mt-4 flex gap-2">
            <span className="text-sm font-semibold bg-slate-900 text-white rounded-full px-3 py-1">{opp.capitalRequired}</span>
            <span className="text-sm font-medium bg-green-50 text-[#16A34A] border border-green-100 rounded-full px-3 py-1">{opp.roi}</span>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={onToggleLike} className={`px-4 py-2 rounded-lg border text-sm font-medium ${opp.liked ? "bg-red-50 border-red-200 text-red-600" : "bg-surface border-border text-text-secondary"}`}>♥ {opp.likes} Interested</button>
            <button onClick={onToggleSave} className={`px-4 py-2 rounded-lg border text-sm font-medium ${opp.saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface border-border text-text-secondary"}`}>{opp.saved ? "★ Saved" : "☆ Save"}</button>
            <button onClick={() => (user ? setIsModalOpen(true) : setError("Log in to inquire."))} className="ml-auto px-5 py-2 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium">Inquire</button>
          </div>
          <div className="mt-6">
            <CommentThread postId={opp.id} comments={comments} onAdd={onAddComment} />
          </div>
        </div>
      </article>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        maxWidth="max-w-lg"
      >
        <ContactForm
          prefill={opp}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async ({ message }) => {
            await inboxApi.inquire({ opportunity_id: opp.id, message });
            setIsModalOpen(false);
          }}
          compact
        />
      </Modal>
    </div>
  );
}
