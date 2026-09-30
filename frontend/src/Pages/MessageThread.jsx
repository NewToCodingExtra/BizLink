import { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
  ArrowLeftIcon,
  ImageIcon,
  FileIcon,
  ChartIcon,
  PlusIcon,
  XIcon,
  VideoIcon,
  GoogleIcon,
  DotsIcon,
} from "../Components/icons";
import QuoteCard from "../Components/QuoteCard";
import PollCard from "../Components/PollCard";
import InsightsCard from "../Components/InsightsCard";
import MeetingCard from "../Components/MeetingCard";
import ConversationList from "../components/ConversationList";
import { httpApi } from "../utils/http";
import { getEcho, watchEchoHealth } from "../utils/echo";
import { profilePath } from "../utils/profilePath";
import { useToast } from "../context/ToastContext";

export default function MessageThread({ conv: initialConv, conversations = [], quote: initialQuote }) {
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

  // Google Meet integration
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetDuration, setMeetDuration] = useState(30);
  const [schedulingMeet, setSchedulingMeet] = useState(false);

  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const whisperAt = useRef(0);
  const fileInputRef = useRef(null);

  // Sync when navigating between threads via the left sidebar (Inertia reuses the component).
  useEffect(() => {
    setConv(initialConv || null);
    setMessages(initialConv?.messages || []);
    setPinned(initialQuote || null);
    setText("");
  }, [initialConv?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Check Google status
  useEffect(() => {
    httpApi.get("/meet/status")
      .then((res) => {
        setGoogleConnected(Boolean(res?.connected));
      })
      .catch(() => {});
  }, []);

  // Reverb broadcast subscription
  useEffect(() => {
    if (!conv?.id) return;
    const client = getEcho();
    if (!client) return;

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

    channel.listen(".meet.scheduled", (e) => {
      const msg = e?.message;
      if (!msg || Number(msg.senderId) === Number(me?.id)) return;
      setMessages((prev) => (prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, { ...msg, from: "them" }]));
    });

    channel.listen(".meet.ended", (e) => {
      const { eventId, status, messageId, message: updatedMsg } = e || {};
      setMessages((prev) =>
        prev.map((m) => {
          if (
            (eventId && m.meetEventId === eventId) ||
            (messageId && Number(m.id) === Number(messageId))
          ) {
            return {
              ...m,
              meetStatus: status || "ended",
              ...(updatedMsg ? updatedMsg : {}),
            };
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
            return merged;
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

  const openMeetScheduler = () => {
    setMeetTitle(`Consultation: ${pinned?.headline || conv?.with || "BizLink"}`);
    const now = new Date(Date.now() + 20 * 60000);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setMeetDate(localIso);
    if (!googleConnected) {
      setShowConnectModal(true);
    } else {
      setShowMeetModal(true);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await httpApi.post("/meet/disconnect");
      setGoogleConnected(false);
      toast.success("Google account disconnected");
    } catch (err) {
      toast.error(err.message || "Failed to disconnect Google");
    }
  };

  const handleScheduleMeet = async (e) => {
    e.preventDefault();
    if (!meetDate) {
      toast.error("Please select a date and time");
      return;
    }
    setSchedulingMeet(true);
    try {
      const res = await httpApi.post(`/conversations/${conv.id}/meet`, {
        title: meetTitle || `Consultation: ${conv.with}`,
        start_at: new Date(meetDate).toISOString(),
        duration: Number(meetDuration),
      });
      const msg = res.data ?? res;
      setMessages((prev) => (prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, msg]));
      setConv((c) => (c ? { ...c, lastMessage: `Meeting scheduled: ${meetTitle || conv.with}` } : c));
      setShowMeetModal(false);
      toast.success("Meeting scheduled");
    } catch (err) {
      if (err.message?.includes("Google account not connected")) {
        setShowMeetModal(false);
        setShowConnectModal(true);
      }
      toast.error(err.message || "Failed to schedule meeting");
    } finally {
      setSchedulingMeet(false);
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
      // Update thread last message
      setConv((c) => (c ? { ...c, lastMessage: `Poll: ${pollQuestion.trim()}` } : c));
      toast.success("Poll created");
    } catch (err) {
      toast.error(err.message || "Failed to create poll");
    }
  };

  const handleVote = async (pollId, optIdx) => {
    try {
      const res = await httpApi.post(`/polls/${pollId}/vote`, { option: optIdx });
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
    <div className="max-w-6xl mx-auto px-0 sm:px-6 py-0 sm:py-6 min-h-[calc(100vh-64px)]">
      <Head title={conv.with || "Conversation"} />
      <div className="flex bg-surface sm:rounded-xl sm:border sm:border-border sm:shadow-sm overflow-hidden h-[calc(100dvh-64px)] sm:h-[calc(100dvh-64px-48px)]">
        {/* Left: contacts — desktop only (mobile uses /messages list) */}
        <aside className="hidden md:flex w-[320px] shrink-0 border-r border-border flex-col min-h-0">
          <ConversationList conversations={conversations} activeId={conv?.id} />
        </aside>

        {/* Right: active thread */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-surface flex items-center gap-3 shrink-0 relative">
        <Link href="/messages" className="md:hidden inline-flex items-center text-text-secondary hover:text-text-primary" aria-label="Back to inbox">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <Link href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })}>
          <img src={conv.avatar} alt={conv.with} className="w-8 h-8 rounded-full" />
        </Link>
        <div className="flex flex-col min-w-0 flex-1">
          <Link href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })} className="text-sm font-semibold text-text-primary hover:text-action truncate">
            {conv.with}
          </Link>
          <span className="text-xs text-text-secondary">Private consultation</span>
        </div>

        {/* ⋯ Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowThreadMenu(!showThreadMenu)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg border border-transparent hover:border-border transition-colors"
            aria-label="Conversation options"
          >
            <DotsIcon className="w-5 h-5" />
          </button>
          {showThreadMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-surface rounded-xl border border-border shadow-lg py-1.5 z-30 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowThreadMenu(false);
                  openMeetScheduler();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-bg flex items-center gap-2"
              >
                <VideoIcon className="w-4 h-4 text-action" />
                <span>Schedule Google Meet</span>
              </button>

              {googleConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowThreadMenu(false);
                    handleDisconnectGoogle();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-error hover:bg-error/10 flex items-center gap-2"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Disconnect Google</span>
                </button>
              ) : (
                <a
                  href={`/meet/connect?return_to=${encodeURIComponent(window.location.pathname)}`}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-bg flex items-center gap-2"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Connect Google</span>
                </a>
              )}
            </div>
          )}
        </div>
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
                          <p className="text-xs font-medium truncate">{m.mediaName || "Download File"}</p>
                          {m.mediaSize && <p className={`text-[10px] ${isMe ? "text-white/70" : "text-text-secondary"}`}>{(m.mediaSize / 1024).toFixed(1)} KB</p>}
                        </div>
                      </a>
                    )}
                  </div>
                )}

                {/* Meeting card rendering */}
                {(m.meetStatus || m.meetEventId || m.meetUrl) && (
                  <MeetingCard
                    message={m}
                    conversationId={conv.id}
                    isMe={isMe}
                    onCancelled={() => {
                      setMessages((prev) =>
                        prev.map((item) =>
                          item.id === m.id
                            ? { ...item, meetStatus: "cancelled" }
                            : item
                        )
                      );
                    }}
                  />
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
        <div className="p-3 bg-surface border-t border-border flex items-center gap-2 overflow-x-auto animate-in fade-in slide-in-from-bottom-2">
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
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[70px] flex-1 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-action" />
            <span>Photo/Video</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[70px] flex-1 transition-colors"
          >
            <FileIcon className="w-5 h-5 text-primary" />
            <span>Document</span>
          </button>
          <button
            type="button"
            onClick={() => { setShowAttachMenu(false); setShowPollModal(true); }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[70px] flex-1 transition-colors"
          >
            <ChartIcon className="w-5 h-5 text-warning" />
            <span>Create Poll</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              openMeetScheduler();
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[70px] flex-1 transition-colors"
          >
            <VideoIcon className="w-5 h-5 text-indigo-500" />
            <span>Google Meet</span>
          </button>
          {conv.isSeller && (
            <button
              type="button"
              onClick={handleShareInsights}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[70px] flex-1 transition-colors"
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
        {pinned && (
          <div className="mb-2 relative">
            <QuoteCard quote={pinned} mode="composer" />
            <button type="button" onClick={() => setPinned(null)} className="absolute top-1.5 right-1.5 text-text-secondary hover:text-text-primary bg-surface/80 rounded-full p-0.5" aria-label="Remove quote">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="w-10 h-10 rounded-full border border-border bg-bg hover:bg-surface flex items-center justify-center text-text-secondary hover:text-action transition-colors shrink-0"
            aria-label="Attachments"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <input
            name="text"
            required
            value={text}
            onChange={(e) => onType(e.target.value)}
            onBlur={handleBlur}
            placeholder={uploading ? "Uploading attachment..." : "Type a message..."}
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
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">Options (min 2)</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required={idx < 2}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="text-text-secondary hover:text-error p-1"
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
                    className="text-xs text-action font-medium hover:underline flex items-center gap-1 mt-1"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Add option
                  </button>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-action hover:bg-action-hover text-white rounded-lg transition-colors"
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meet Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-action/10 text-action grid place-items-center">
                  <VideoIcon className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Schedule Google Meet</h2>
              </div>
              <button onClick={() => setShowMeetModal(false)} className="text-text-secondary hover:text-text-primary">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleMeet} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="e.g. Consultation: Partnership terms"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date & Time (Local)</label>
                <input
                  type="datetime-local"
                  required
                  value={meetDate}
                  onChange={(e) => setMeetDate(e.target.value)}
                  min={new Date(Date.now() + 15 * 60000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none"
                />
                <p className="text-[11px] text-text-secondary mt-1">Must be at least 15 minutes in advance.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMeetDuration(mins)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        meetDuration === mins
                          ? "bg-action text-white border-action"
                          : "bg-bg text-text-secondary border-border hover:bg-surface"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMeetModal(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingMeet}
                  className="px-4 py-2 text-xs font-medium bg-action hover:bg-action-hover text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {schedulingMeet ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Google Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-action/10 text-action grid place-items-center mx-auto">
              <GoogleIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Connect Google Account</h2>
              <p className="text-xs text-text-secondary mt-1">
                To schedule Google Meet video calls directly in chat, connect your Google account with Google Calendar access.
              </p>
            </div>
            <div className="p-3 bg-bg rounded-xl border border-border text-[11px] text-text-secondary text-left space-y-1">
              <p>• Requires Calendar Events permission</p>
              <p>• Automatically mints Google Meet conference links</p>
              <p>• You can disconnect anytime from thread options</p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border"
              >
                Cancel
              </button>
              <a
                href={`/meet/connect?return_to=${encodeURIComponent(window.location.pathname)}`}
                className="flex-1 py-2 text-xs font-medium bg-action hover:bg-action-hover text-white rounded-lg transition-colors shadow-sm text-center flex items-center justify-center gap-1.5"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Connect Google</span>
              </a>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
