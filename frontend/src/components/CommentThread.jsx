import { useState } from "react";

export default function CommentThread({ postId, comments, onAdd }) {
  const [text, setText] = useState("");
  const list = comments.filter(c => c.postId === postId);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ id: `c-${Date.now()}`, postId, author: "You", avatar: "https://i.pravatar.cc/100?img=12", text: text.trim(), timestamp: "now", isSellerReply: false });
    setText("");
  };

  return (
    <div className="pt-3 border-t border-slate-100 mt-3">
      <p className="text-xs font-semibold tracking-widest text-slate-400">COMMENTS · {list.length}</p>
      <div className="mt-3 space-y-3">
        {list.length === 0 && <p className="text-sm text-slate-400">Be the first to ask a question.</p>}
        {list.map(c => (
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
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Ask about ROI, capital, support..." className="flex-1 border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2 text-sm placeholder:text-slate-400" maxLength={280} />
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium hover:bg-[#1E3A5F] transition-colors">Reply</button>
      </form>
    </div>
  );
}
