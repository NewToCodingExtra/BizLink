import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function CommentThread({ postId, comments, onAdd }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const list = (comments || []).filter((c) => String(c.postId) === String(postId));

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    if (!user) return;
    setBusy(true);
    try {
      await onAdd({ postId, text: text.trim() });
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-3 border-t border-slate-100 mt-3">
      <p className="text-xs font-semibold tracking-widest text-slate-400">COMMENTS · {list.length}</p>
      <div className="mt-3 space-y-3">
        {list.length === 0 && <p className="text-sm text-slate-400">Be the first to ask a question.</p>}
        {list.map((c) => (
          <div key={c.id} className={`flex gap-3 p-3 rounded-xl border ${c.isSellerReply ? "bg-amber-50/60 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
            <img src={c.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{c.author}</span>
                {c.isSellerReply && <span className="text-[10px] font-bold tracking-widest bg-[#0B1F3A] text-white px-2 py-0.5 rounded-full">SELLER</span>}
                <span className="text-xs text-slate-400">{c.timestamp}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      {user ? (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about ROI, capital, support..." className="flex-1 border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2 text-sm placeholder:text-slate-400" maxLength={1000} />
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#1E3A5F] disabled:opacity-60 transition-colors">Reply</button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Log in to join the discussion.</p>
      )}
    </div>
  );
}
