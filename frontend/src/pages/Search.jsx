import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import OpportunityCard from "../components/OpportunityCard";
import ContactForm from "../components/ContactForm";
import { FeedSkeleton } from "../components/Skeleton";
import { inboxApi, opportunitiesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) setParams(input ? { q: input } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [input, q, setParams]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    opportunitiesApi
      .list({ q: q.trim(), per_page: 30 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || [];
        setResults(data);
        setComments(data.flatMap((o) => o.comments || []));
        setSavedIds(data.filter((o) => o.saved).map((o) => o.id));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const onToggleLike = async (id) => {
    if (!user) {
      setError("Log in to like opportunities.");
      return;
    }
    setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: !o.liked, likes: o.liked ? o.likes - 1 : o.likes + 1 } : o)));
    try {
      const res = await opportunitiesApi.toggleLike(id);
      setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, liked: res.liked, likes: res.likes_count } : o)));
    } catch (err) {
      setError(err.message || "Like failed");
    }
  };

  const onToggleSave = async (id) => {
    if (!user) {
      setError("Log in to save opportunities.");
      return;
    }
    try {
      const res = await opportunitiesApi.toggleSave(id);
      setSavedIds((prev) => (res.saved ? [...new Set([...prev, id])] : prev.filter((x) => String(x) !== String(id))));
      setResults((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, saved: res.saved } : o)));
    } catch (err) {
      setError(err.message || "Save failed");
    }
  };

  const onAddComment = async ({ postId, text }) => {
    if (!user) return;
    const res = await opportunitiesApi.addComment(postId, text);
    setComments((prev) => [...prev, res.data]);
  };

  const onInquire = (opp) => {
    if (!user) {
      setError("Log in to inquire.");
      return;
    }
    setSelectedPost(opp);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Search</h1>
      <div className="mt-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg>
        </span>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search brands, categories..." className="w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg pl-9 pr-4 py-3 text-sm bg-white" />
      </div>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      {!q ? (
        <p className="text-sm text-slate-500 mt-6">Type to search franchises, wholesale and resell opportunities.</p>
      ) : loading ? (
        <div className="mt-6"><FeedSkeleton count={2} /></div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center mt-6">
          <p className="text-sm text-slate-600">No opportunities match “{q}” — try a broader term.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">{results.length} result{results.length !== 1 ? "s" : ""} for “{q}”</p>
          {results.map((o) => (
            <OpportunityCard key={o.id} opp={o} comments={comments} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onAddComment={onAddComment} onInquire={onInquire} saved={savedIds.map(String).includes(String(o.id))} />
          ))}
        </div>
      )}

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
