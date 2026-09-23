import { useState } from "react";
import { Head } from "@inertiajs/react";
import OpportunityCard from "../Components/OpportunityCard";
import ContactForm from "../Components/ContactForm";
import Modal from "../Components/Modal";
import { httpApi } from "../utils/http";

export default function Saved({ opportunities: initialOpps = [] }) {
  const [opps, setOpps] = useState(initialOpps || []);
  const [comments, setComments] = useState(() => (initialOpps || []).flatMap((o) => o.comments || []));
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onToggleLike = async (id) => {
    setOpps((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await httpApi.post(`/opportunities/${id}/like`);
      setOpps((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async (id) => {
    try {
      const res = await httpApi.post(`/opportunities/${id}/save`);
      if (!res.saved) {
        setOpps((prev) => prev.filter((o) => String(o.id) !== String(id)));
      }
    } catch (err) {
      setError(err.message || "Unsave failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    const res = await httpApi.post(`/opportunities/${postId}/comments`, { text });
    const comment = res.data ?? res;
    setComments((prev) => [...prev, comment]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title="Saved Opportunities" />
      <h1 className="text-2xl font-semibold text-primary">Saved Opportunities</h1>
      <p className="text-sm text-text-secondary mt-1">Bookmarked posts from MySQL — quick access to your shortlist.</p>
      {error && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="mt-6 space-y-4">
        {opps.length === 0 && <div className="bg-surface rounded-xl border border-border p-8 text-center"><p className="text-sm text-text-secondary">No saves yet. Tap ☆ Save on any card.</p></div>}
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
            saved={true}
          />
        ))}
        {opps.length > 0 && (
          <p className="text-center text-xs text-text-secondary py-2">{opps.length} saved · End of your shortlist.</p>
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
            await httpApi.post("/inquiries", { opportunity_id: selectedPost.id, message });
            setIsModalOpen(false);
          }}
          compact
        />
      </Modal>
    </div>
  );
}
