import { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeftIcon, ImageIcon, FileIcon, ChartIcon, PlusIcon, XIcon } from "../Components/icons";
import QuoteCard from "../Components/QuoteCard";
import PollCard from "../Components/PollCard";
import InsightsCard from "../Components/InsightsCard";
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
  
  // Attachments and modals
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const whisperAt = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Live: incoming messages, polls, and typing whispers
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
      if (!msg || Number(msg.senderId) === Number(me?.id)) return;
      setMessages((prev) => (prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, { ...msg, from: "them" }]));
    });

    channel.listen(".poll.updated", (e) => {
      const updatedPoll = e?.poll;
      if (!updatedPoll) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.poll && Number(m.poll.id) === Number(updatedPoll.id)) {
            return { ...m, poll: { ...updatedPoll, myVote: m.poll.myVote } };
          }
          return m;
        })
      );
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
  }, [conv?.id, me?.id]);

  // Fallback polling
  useEffect(() => {
    if (!liveDown || !conv) return;
    const iv = setInterval(() => {
      router.reload({
        only: ["conv"],
        onSuccess: (page) => {
          const fresh = page?.props?.conv?.messages ?? [];
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => String(m.id)));
            const merged = [...prev, ...fresh.filter((m) => !seen.has(String(m.id)))];
            return merged.length === prev.length ? prev : merged;
          });
        },
      });
    }, 15000);
    return () => clearInterval(iv);
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
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const sentText = text.trim();
      const body = { text: sentText };
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setShowAttachMenu(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
      const res = await fetch("/uploads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-TOKEN": csrf, "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      // Send the uploaded media immediately
      const body = {
        text: "",
        media_url: data.url,
        media_type: data.media_type,
        media_name: file.name,
        media_size: file.size,
      };
      const msgRes = await httpApi.post(`/conversations/${conv.id}/messages`, body);
      const msg = msgRes.data ?? msgRes;
      setMessages((prev) => [...prev, msg]);
      setConv((c) => (c ? { ...c, lastMessage: `Sent a ${data.media_type}` } : c));
      toast.success("File sent");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleShareInsights = async () => {
    setShowAttachMenu(false);
    try {
      const res = await httpApi.post(`/conversations/${conv.id}/insights`);
      const msg = res.data ?? res;
      setMessages((prev) => [...prev, msg]);
      setConv((c) => (c ? { ...c, lastMessage: "Shared brand insights" } : c));
      toast.success("Insights shared");
    } catch (err) {
      toast.error(err.message || "Failed to share insights");
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOpts.length < 2) {
      toast.error("Enter a question and at least 2 options");
      return;
    }
    try {
      const res = await httpApi.post(`/conversations/${conv.id}/polls`, {
        question: pollQuestion.trim(),
        options: validOpts,
      });
      setShowPollModal(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      // Refresh to grab the created poll system message
      router.reload({ only: ["conv"] });
      toast.success("Poll created");
    } catch (err) {
      toast.error(err.message || "Failed to create poll");
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      const res = await httpApi.post(`/polls/${pollId}/vote`, { option: optionIndex });
      const updated = res.data ?? res;
      setMessages((prev) =>
        prev.map((m) => (m.poll && Number(m.poll.id) === Number(pollId) ? { ...m, poll: updated } : m))
      );
    } catch (err) {
      toast.error(err.message || "Vote failed");
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      const res = await httpApi.post(`/polls/${pollId}/close`);
      const updated = res.data ?? res;
      setMessages((prev) =>
        prev.map((m) => (m.poll && Number(m.poll.id) === Number(pollId) ? { ...m, poll: updated } : m))
      );
      toast.success("Poll closed");
    } catch (err) {
      toast.error(err.message || "Failed to close poll");
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

  if (!conv) {
    return (
      <div className="max-w-2xl mx-auto min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
        <Head title="Conversation" />
        <p className="text-text-secondary mb-2">Conversation not found.</p>
        <Link href="/messages" className="text-action text-sm font-medium">Back to inbox</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-64px)]">
      <Head title={conv.with || "Conversation"} />
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-surface flex items-center gap-3 shrink-0">
        <Link href="/messages" className="inline-flex items-center text-text-secondary hover:text-text-primary" aria-label="Back to inbox">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <Link href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })}>
          <img src={conv.avatar} alt={conv.with} className="w-8 h-8 rounded-full" />
        </Link>
        <Link href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })} className="text-sm font-semibold text-text-primary hover:text-action">
          {conv.with}
        </Link>
        <span className="text-xs text-text-secondary">Private consultation</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 bg-[var(--color-bg)]">
        {messages.map((m) => {
          const isMe = m.from === "me";
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe ? "bg-action text-white rounded-br-md" : "bg-surface border border-border text-text-primary rounded-bl-md shadow-sm"}`}>
                {m.attachment && <QuoteCard quote={m.attachment} mode="inline" dark={isMe} />}

                {/* Media rendering */}
                {m.mediaUrl && (
                  <div className="mb-2">
                    {m.mediaType === "image" && (
                      <img src={m.mediaUrl} alt="attachment" className="rounded-lg max-h-60 w-full object-cover" />
                    )}
                    {m.mediaType === "video" && (
                      <video src={m.mediaUrl} controls className="rounded-lg max-h-60 w-full bg-black" />
                    )}
                    {m.mediaType === "file" && (
                      <a
                        href={m.mediaUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          isMe ? "bg-black/20 border-white/20 hover:bg-black/30" : "bg-bg border-border hover:bg-surface"
                        }`}
                      >
                        <FileIcon className="w-6 h-6 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{m.mediaName || "Document"}</p>
                          <p className={`text-[10px] ${isMe ? "text-white/70" : "text-text-secondary"}`}>
                            {m.mediaSize ? `${(m.mediaSize / (1024 * 1024)).toFixed(2)} MB` : "File"}
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                )}

                {/* Poll rendering */}
                {m.poll && (
                  <div className="mb-2">
                    <PollCard poll={m.poll} dark={isMe} onVote={handleVote} onClose={handleClosePoll} />
                  </div>
                )}

                {/* Insights rendering */}
                {m.insight && (
                  <div className="mb-2">
                    <InsightsCard insight={m.insight} dark={isMe} />
                  </div>
                )}

                {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                <p className={`text-[11px] mt-1 text-right ${isMe ? "text-white/70" : "text-text-secondary"}`}>{m.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attach Menu Dropdown */}
      {showAttachMenu && (
        <div className="p-3 bg-surface border-t border-border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium flex-1 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-action" />
            <span>Photo/Video</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium flex-1 transition-colors"
          >
            <FileIcon className="w-5 h-5 text-primary" />
            <span>Document</span>
          </button>
          <button
            type="button"
            onClick={() => { setShowAttachMenu(false); setShowPollModal(true); }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium flex-1 transition-colors"
          >
            <ChartIcon className="w-5 h-5 text-warning" />
            <span>Create Poll</span>
          </button>
          {conv.isSeller && (
            <button
              type="button"
              onClick={handleShareInsights}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium flex-1 transition-colors"
            >
              <ChartIcon className="w-5 h-5 text-success" />
              <span>Share Insights</span>
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={send} className="p-4 bg-surface border-t border-border shrink-0">
        {liveDown && <p className="mb-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-1.5">Reconnecting… live updates paused, refreshing every 15s.</p>}
        {typingName && !liveDown && <p className="mb-2 text-xs text-text-secondary italic">{typingName} is typing…</p>}
        {pinned && <QuoteCard quote={pinned} mode="pin" onDismiss={() => setPinned(null)} />}
        <div className="flex gap-2 relative items-center">
          <button
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            className="p-3 rounded-full border border-border bg-bg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors shrink-0"
            aria-label="Add attachment"
          >
            <PlusIcon className={`w-4 h-4 transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
          </button>
          <input
            name="text"
            value={text}
            onChange={(e) => onType(e.target.value)}
            onBlur={handleBlur}
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            disabled={uploading}
            className={getInputClass('text')}
          />
          <button
            type="submit"
            disabled={sending || uploading || !text.trim()}
            className="px-6 py-3 rounded-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-medium shrink-0 transition-colors"
          >
            Send
          </button>
        </div>
        {fieldErrors.text && <p className="mt-1 text-xs text-error absolute ml-2">{fieldErrors.text}</p>}
      </form>

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Create a Poll</h2>
              <button onClick={() => setShowPollModal(false)} className="text-text-secondary hover:text-text-primary">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary outline-none focus:border-action"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">Options (2 to 5)</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary outline-none focus:border-action"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="p-2 text-text-secondary hover:text-error"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-xs font-medium text-action hover:underline"
                  >
                    + Add Option
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm bg-action hover:bg-action-hover text-white font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
