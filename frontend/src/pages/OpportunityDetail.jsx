import { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import CommentThread from "../Components/CommentThread";
import ContactForm from "../Components/ContactForm";
import Modal from "../Components/Modal";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";

function badgeClasses(type) {
  if (type === "Franchise") return "bg-warning/10 text-warning border border-warning/20";
  if (type === "Wholesale") return "bg-bg text-text-primary border-border";
  return "bg-action/10 text-action border border-action/20";
}

export default function OpportunityDetail({ opp: initialOpp }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const [opp, setOpp] = useState(initialOpp ?? null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setOpp(initialOpp ?? null);
  }, [initialOpp]);

  const comments = opp?.comments ?? [];

  const onToggleLike = async () => {
    if (!user || !opp) {
      if (!user) toast.error("Log in to like opportunities.");
      return;
    }
    setOpp({ ...opp, liked: !opp.liked, likes: opp.liked ? opp.likes - 1 : opp.likes + 1 });
    try {
      const res = await httpApi.post(`/opportunities/${opp.id}/like`);
      setOpp((prev) => ({ ...prev, liked: res.liked ?? prev.liked, likes: res.likes_count ?? prev.likes }));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async () => {
    if (!user || !opp) {
      if (!user) toast.error("Log in to save opportunities.");
      return;
    }
    try {
      const res = await httpApi.post(`/opportunities/${opp.id}/save`);
      setOpp((prev) => ({ ...prev, saved: res.saved, saves: res.saves_count ?? prev.saves }));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ text }) => {
    if (!user || !opp) return;
    try {
      const res = await httpApi.post(`/opportunities/${opp.id}/comments`, { text });
      const comment = res?.data ?? res;
      setOpp((prev) => ({ ...prev, comments: [...(prev.comments || []), comment] }));
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  };

  if (!opp) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-text-secondary">Opportunity not found.</p><Link href="/feed" className="text-action text-sm font-medium">Back to feed</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title={opp.headline} />
      <Link href="/feed" className="text-sm text-text-secondary hover:text-text-primary">← Back</Link>
      {error && <p className="mt-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      <article className="mt-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <img src={opp.image} alt={opp.headline} className="w-full h-[360px] object-cover" />
        <div className="p-6">
          <div className="flex items-center gap-2">
            <img src={opp.brandAvatar} alt={opp.brandName} className="w-9 h-9 rounded-full" />
            <span className="text-sm font-semibold text-text-primary">{opp.brandName}</span>
            {opp.verified && <span className="text-xs font-bold text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">✓ Verified</span>}
            <span className={`ml-auto text-xs font-medium border rounded-full px-2.5 py-1 ${badgeClasses(opp.type)}`}>{opp.type}</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight mt-4">{opp.headline}</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{opp.description}</p>
          <div className="mt-4 flex gap-2">
            <span className="text-sm font-semibold bg-primary-light text-white rounded-full px-3 py-1">{opp.capitalRequired}</span>
            <span className="text-sm font-medium bg-success/10 text-success border border-success/20 rounded-full px-3 py-1">{opp.roi}</span>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={onToggleLike} className={`px-4 py-2 rounded-lg border text-sm font-medium ${opp.liked ? "bg-error/10 border border-error/20 text-error" : "bg-surface border-border text-text-secondary"}`}>♥ {opp.likes} Interested</button>
            <button onClick={onToggleSave} className={`px-4 py-2 rounded-lg border text-sm font-medium ${opp.saved ? "bg-primary text-white border-[#0B1F3A]" : "bg-surface border-border text-text-secondary"}`}>{opp.saved ? "★ Saved" : "☆ Save"}</button>
            <button onClick={() => (user ? setIsModalOpen(true) : toast.error("Log in to inquire."))} className="ml-auto px-5 py-2 rounded-lg bg-action hover:bg-action-hover text-white text-sm font-medium">Inquire</button>
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
            try {
              const res = await httpApi.post("/inquiries", { opportunity_id: opp.id, message });
              setIsModalOpen(false);
              const convId = res?.conversation?.withUsername || res?.conversation?.brandId || res?.conversation?.id;
              if (convId) {
                import("@inertiajs/react").then(({ router }) => router.visit(`/messages/${convId}`));
              } else {
                toast.success("Inquiry sent.");
              }
            } catch (err) {
              toast.error(err.message || "Inquiry failed");
            }
          }}
          compact
        />
      </Modal>
    </div>
  );
}
