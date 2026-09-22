import { useEffect, useState } from "react";
import ReelCard from "../components/ReelCard";
import ContactForm from "../components/ContactForm";
import { ReelsSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    opportunitiesApi
      .list({ per_page: 30 })
      .then((res) => {
        if (cancelled) return;
        setReels((res.data || []).filter((o) => o.mediaType === "video"));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load reels");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggleLike = async (id) => {
    if (!user) {
      setError("Log in to like reels.");
      return;
    }
    setReels((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(id);
      setReels((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  if (loading) return <ReelsSkeleton count={2} />;
  if (error && reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-slate-500">{error}</p></div>;
  if (reels.length === 0) return <div className="max-w-md mx-auto py-12 text-center"><p className="text-slate-500">No pitch reels yet — post a video opportunity.</p></div>;

  return (
    <div className="relative">
      {error && <p className="mx-auto max-w-md mt-3 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div className="h-[calc(100dvh-64px)] overflow-y-scroll snap-y snap-mandatory bg-black">
        {reels.map((r) => (
          <ReelCard key={r.id} opp={r} onToggleLike={onToggleLike} onInquire={(o) => (user ? setSelected(o) : setError("Log in to inquire."))} />
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto">
            <ContactForm
              prefill={selected}
              onClose={() => setSelected(null)}
              onSubmit={async ({ message }) => {
                await inboxApi.inquire({ opportunity_id: selected.id, message });
                setSelected(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
