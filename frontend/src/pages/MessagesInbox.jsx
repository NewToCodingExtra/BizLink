import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { inboxApi } from "../api/client";
import { ListCardSkeleton } from "../components/Skeleton";

export default function MessagesInbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    inboxApi
      .conversations()
      .then((res) => {
        if (!cancelled) setConversations(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load inbox");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Consultation Inbox</h1>
      <p className="text-sm text-slate-500 mt-1">Private buyer ↔ seller threads from MySQL. Separate from public comments.</p>
      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {loading ? (
        <div className="mt-6"><ListCardSkeleton rows={4} /></div>
      ) : (
        <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {conversations.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No conversations yet — tap Inquire on any card.</p>}
          {conversations.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
              <Link to={`/profile/${c.brandId}`} className="shrink-0" title={`View ${c.with}`}>
                <img src={c.avatar} alt={c.with} className="w-10 h-10 rounded-full" />
              </Link>
              <Link to={`/messages/${c.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{c.with}</span>
                    {c.unread > 0 && <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{c.lastMessage}</p>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && conversations.length > 0 && (
        <p className="text-center text-xs text-slate-400 mt-4">{conversations.length} thread{conversations.length !== 1 ? "s" : ""} · No more messages below.</p>
      )}
    </div>
  );
}
