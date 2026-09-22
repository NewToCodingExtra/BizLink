import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { inboxApi } from "../api/client";

export default function MessageThread() {
  const { conversationId } = useParams();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    inboxApi
      .conversation(conversationId)
      .then((res) => {
        if (cancelled) return;
        setConv(res.data);
        setMessages(res.data.messages || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load conversation");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await inboxApi.send(conversationId, text.trim());
      setMessages((prev) => [...prev, res.data]);
      setConv((prev) => (prev ? { ...prev, lastMessage: text.trim() } : prev));
      setText("");
    } catch (err) {
      setError(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-slate-500">Loading thread...</p></div>;
  if (error && !conv) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-slate-500">{error}</p><Link to="/messages" className="text-[#2563EB] text-sm">Back to inbox</Link></div>;
  if (!conv) return <div className="max-w-2xl mx-auto py-12 text-center"><p className="text-slate-500">Conversation not found.</p><Link to="/messages" className="text-[#2563EB] text-sm">Back to inbox</Link></div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-64px)]">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        <Link to="/messages" className="text-slate-500 hover:text-slate-700">←</Link>
        <Link to={`/profile/${conv.brandId}`}><img src={conv.avatar} alt={conv.with} className="w-8 h-8 rounded-full" /></Link>
        <Link to={`/profile/${conv.brandId}`} className="text-sm font-semibold text-slate-900 hover:text-[#2563EB]">{conv.with}</Link>
        <span className="text-xs text-slate-400">Private consultation</span>
      </div>
      {error && <p className="mx-4 mt-3 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#F8FAFC]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from === "me" ? "bg-[#2563EB] text-white rounded-br-md" : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm"}`}>
              <p>{m.text}</p>
              <p className={`text-[11px] mt-1 ${m.from === "me" ? "text-white/70" : "text-slate-400"}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-full px-4 py-3 text-sm" />
        <button type="submit" disabled={sending} className="px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white text-sm font-medium">Send</button>
      </form>
    </div>
  );
}
