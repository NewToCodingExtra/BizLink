import { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeftIcon } from "../Components/icons";
import QuoteCard from "../Components/QuoteCard";
import { httpApi } from "../utils/http";
import { getEcho, watchEchoHealth } from "../utils/echo";
import { profilePath } from "../utils/profilePath";

import { useToast } from '../context/ToastContext';

export default function MessageThread({ conv: initialConv, quote: initialQuote }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const me = auth?.user ?? null;
  const [conv, setConv] = useState(initialConv || null);
  const [messages, setMessages] = useState(initialConv?.messages || []);
  const [pinned, setPinned] = useState(initialQuote || null);
  const [text, setText] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [liveDown, setLiveDown] = useState(false);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const whisperAt = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  // Live: incoming messages + typing whispers on this conversation.
  useEffect(() => {
    if (!conv) return;
    const client = getEcho();
    if (!client) {
      setLiveDown(true);
      return;
    }
    const channel = client.private(`conversation.${conv.id}`);
    channel.listen(".message.sent", (e) => {
      const msg = e?.message;
      if (!msg || Number(msg.senderId) === Number(me?.id)) return; // own sends already appended
      setMessages((prev) => (prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, { ...msg, from: "them" }]));
    });
    channel.listenForWhisper("typing", (e) => {
      if (!e?.name || e.name === me?.name) return;
      setTypingName(e.name);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(""), 3000);
    });
    const stopHealth = watchEchoHealth(() => setLiveDown(true));
    return () => {
      stopHealth();
      if (typingTimer.current) clearTimeout(typingTimer.current);
      client.leave(`conversation.${conv.id}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.id]);

  // Fallback polling when the socket is down (visible chip, 15s cadence).
  useEffect(() => {
    if (!liveDown || !conv) return;
    const iv = setInterval(() => {
      router.reload({ only: ["conv"], onSuccess: (page) => {
        const fresh = page?.props?.conv?.messages ?? [];
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => String(m.id)));
          const merged = [...prev, ...fresh.filter((m) => !seen.has(String(m.id)))];
          return merged.length === prev.length ? prev : merged;
        });
      } });
    }, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDown, conv?.id]);

  const onType = (v) => {
    setText(v);
    const now = Date.now();
    if (now - whisperAt.current < 2500) return;
    whisperAt.current = now;
    try {
      getEcho()?.private(`conversation.${conv.id}`).whisper("typing", { name: me?.name || "Someone" });
    } catch {}
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const sentText = text.trim();
      const body = { text: sentText };
      // First send carries the pinned quote (reel/post/story), then unpins.
      if (pinned && !pinned.expired) {
        body.attachment = {
          type: pinned.kind === "story" ? "story" : "opportunity",
          id: pinned.id,
        };
      }
      const res = await httpApi.post(`/conversations/${conv.id}/messages`, body);
      const msg = res.data ?? res;
      setMessages((prev) => [...prev, msg]);
      setConv((c) => (c ? { ...c, lastMessage: sentText } : c));
      setText("");
      setPinned(null);
    } catch (err) {
      toast.error(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    if (!e.target.checkValidity()) {
      setFieldErrors((prev) => ({ ...prev, [field]: e.target.validationMessage }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getInputClass = (field) => {
    const base = "flex-1 border outline-none rounded-full px-4 py-3 text-sm transition-colors";
    return fieldErrors[field]
      ? `${base} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5`
      : `${base} border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-transparent`;
  };

  if (!conv) return <div className="max-w-2xl mx-auto min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center"><Head title="Conversation" /><p className="text-text-secondary mb-2">Conversation not found.</p><Link href="/messages" className="text-action text-sm font-medium">Back to inbox</Link></div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-64px)]">
      <Head title={conv.with || "Conversation"} />
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-surface flex items-center gap-3">
        <Link href="/messages" className="inline-flex items-center text-text-secondary hover:text-text-primary" aria-label="Back to inbox"><ArrowLeftIcon className="w-5 h-5" /></Link>
        <Link href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })}><img src={conv.avatar} alt={conv.with} className="w-8 h-8 rounded-full" /></Link>
        <Link href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })} className="text-sm font-semibold text-text-primary hover:text-action">{conv.with}</Link>
        <span className="text-xs text-text-secondary">Private consultation</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-[var(--color-bg)]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from === "me" ? "bg-action text-white rounded-br-md" : "bg-surface border border-border text-text-primary rounded-bl-md shadow-sm"}`}>
              {m.attachment && <QuoteCard quote={m.attachment} mode="inline" dark={m.from === "me"} />}
              <p>{m.text}</p>
              <p className={`text-[11px] mt-1 ${m.from === "me" ? "text-white/70" : "text-text-secondary"}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-4 bg-surface border-t border-border">
        {liveDown && <p className="mb-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-1.5">Reconnecting… live updates paused, refreshing every 15s.</p>}
        {typingName && !liveDown && <p className="mb-2 text-xs text-text-secondary italic">{typingName} is typing…</p>}
        {pinned && <QuoteCard quote={pinned} mode="pin" onDismiss={() => setPinned(null)} />}
        <div className="flex gap-2 relative">
          <input name="text" value={text} onChange={(e) => { onType(e.target.value); }} onBlur={handleBlur} required placeholder="Type a message..." className={getInputClass('text')} />
          <button type="submit" disabled={sending} className="px-6 py-3 rounded-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium">Send</button>
        </div>
        {fieldErrors.text && <p className="mt-1 text-xs text-error absolute ml-2">{fieldErrors.text}</p>}
      </form>
    </div>
  );
}
