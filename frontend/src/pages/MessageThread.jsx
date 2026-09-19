import { useParams, Link } from "react-router-dom";
import { useState } from "react";

export default function MessageThread({ conversations, messages, onSend }) {
  const { conversationId } = useParams();
  const conv = conversations.find(c=>c.id===conversationId);
  const thread = messages.filter(m=>m.conversationId===conversationId);
  const [text, setText] = useState("");

  if (!conv) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-slate-500">Conversation not found.</p><Link to="/messages" className="text-[#2563EB] text-sm">Back to inbox</Link></div>;

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(conversationId, text.trim());
    setText("");
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-64px)]">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <Link to="/messages" className="text-slate-500 hover:text-slate-700">←</Link>
        <img src={conv.avatar} className="w-8 h-8 rounded-full" />
        <span className="text-sm font-semibold text-slate-900">{conv.with}</span>
        <span className="text-xs text-slate-400">Private consultation</span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#F8FAFC]">
        {thread.map(m => (
          <div key={m.id} className={`flex ${m.from==="me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from==="me" ? "bg-[#2563EB] text-white rounded-br-md" : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm"}`}>
              <p>{m.text}</p>
              <p className={`text-[11px] mt-1 ${m.from==="me" ? "text-white/70" : "text-slate-400"}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-full px-4 py-3 text-sm" />
        <button type="submit" className="px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium">Send</button>
      </form>
    </div>
  );
}
