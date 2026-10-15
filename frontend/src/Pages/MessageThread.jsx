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
  ReplyIcon,
  InfoIcon,
  BellSlashIcon,
  CheckIcon,
} from "../components/icons";
import QuoteCard from "../components/QuoteCard";
import PollCard from "../components/PollCard";
import InsightsCard from "../components/InsightsCard";
import MeetingCard from "../components/MeetingCard";
import ConversationList from "../components/ConversationList";
import DropdownMenu from "../components/DropdownMenu";
import ReportModal from "../components/ReportModal";
import ChatInfoPanel from "../components/ChatInfoPanel";
import LinkPreviewCard, { renderWithLinks, extractUrl } from "../components/LinkPreviewCard";
import { httpApi, csrfFetch } from "../utils/http";
import { getEcho, watchEchoHealth } from "../utils/echo";
import { profilePath } from "../utils/profilePath";
import { useToast } from "../context/ToastContext";

function getDateLabel(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isDifferentDay(isoA, isoB) {
  if (!isoA || !isoB) return true;
  const da = new Date(isoA);
  const db = new Date(isoB);
  return da.toDateString() !== db.toDateString();
}

export default function MessageThread({ conv: initialConv, conversations = [], quote: initialQuote }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const me = auth?.user ?? null;
  const [conv, setConv] = useState(initialConv || null);
  const [messages, setMessages] = useState(initialConv?.messages || []);
  const [pinned, setPinned] = useState(initialQuote || null);
  const [replyTo, setReplyTo] = useState(null);
  const [text, setText] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [liveDown, setLiveDown] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

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
  const threadMenuBtnRef = useRef(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [meetDuration, setMeetDuration] = useState(30);
  const [schedulingMeet, setSchedulingMeet] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const whisperAt = useRef(0);
  const fileInputRef = useRef(null);

  // Sync when navigating between threads via the left sidebar
  useEffect(() => {
    setConv(initialConv || null);
    setMessages(initialConv?.messages || []);
    setPinned(initialQuote || null);
    setReplyTo(null);
    setText("");
  }, [initialConv?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Check Google status
  useEffect(() => {
    httpApi
      .get("/meet/status")
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
      setMessages((prev) =>
        prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, { ...msg, from: "them" }]
      );
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
      setMessages((prev) =>
        prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, { ...msg, from: "them" }]
      );
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

  const jumpToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2200);
    } else {
      toast.error("Message not found in recent history");
    }
  };

  const onType = (v) => {
    setText(v);
    const now = Date.now();
    if (now - whisperAt.current < 2500) return;
    whisperAt.current = now;
    try {
      getEcho()?.private(`conversation.${conv.id}`).whisper("typing", { name: me?.name || "Someone" });
    } catch {}
  };

  const initiateReply = (msg) => {
    setReplyTo({
      id: msg.id,
      senderName: msg.from === "me" ? "yourself" : conv.with,
      text: msg.text || (msg.mediaType ? `Sent a ${msg.mediaType}` : "Message"),
      mediaType: msg.mediaType,
    });
    inputRef.current?.focus();
  };

  const send = async (e) => {
    if (e) e.preventDefault();
    if (conv?.isBlocked) {
      toast.error("You cannot send messages in this conversation.");
      return;
    }
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const sentText = text.trim();
      const body = { text: sentText };
      if (replyTo?.id) {
        body.reply_to_id = replyTo.id;
      }
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
      setReplyTo(null);
    } catch (err) {
      toast.error(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (conv?.isBlocked) {
      toast.error("You cannot send messages in this conversation.");
      return;
    }
    setUploading(true);
    setShowAttachMenu(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await csrfFetch("/uploads", { formData: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      // Send the uploaded media immediately
      const body = {
        text: "",
        reply_to_id: replyTo?.id || null,
        media_url: data.url,
        media_type: data.media_type,
        media_name: file.name,
        media_size: file.size,
      };
      const msgRes = await httpApi.post(`/conversations/${conv.id}/messages`, body);
      const msg = msgRes.data ?? msgRes;
      setMessages((prev) => [...prev, msg]);
      setConv((c) => (c ? { ...c, lastMessage: `Sent a ${data.media_type}` } : c));
      setReplyTo(null);
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
    if (conv?.isBlocked) return;
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
    const base = "flex-1 border outline-none rounded-full px-4 py-2.5 sm:py-3 text-sm transition-all";
    return fieldErrors[field]
      ? `${base} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5`
      : `${base} border-border focus:border-action focus:ring-2 focus:ring-action/20 bg-bg text-text-primary`;
  };

  if (!conv) {
    return (
      <div className="max-w-2xl mx-auto min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center p-6">
        <Head title="Conversation" />
        <p className="text-text-secondary mb-3">Conversation not found.</p>
        <Link
          href="/messages"
          className="px-4 py-2 rounded-full bg-action text-white text-xs font-semibold hover:bg-action-hover transition-colors"
        >
          Back to inbox
        </Link>
      </div>
    );
  }

  // Find index of the last sent message by me to show read receipt
  const lastMeMsgIndex = messages.map((m) => m.from === "me").lastIndexOf(true);

  return (
    <div className="max-w-[1440px] mx-auto px-0 sm:px-4 py-0 sm:py-4 min-h-[calc(100dvh-64px)]">
      <Head title={conv.with ? `${conv.with} · Chat` : "Chat"} />

      {/* 3-Pane Shell Container */}
      <div className="flex bg-surface sm:rounded-2xl sm:border sm:border-border sm:shadow-sm overflow-hidden h-[calc(100dvh-64px)] sm:h-[calc(100dvh-64px-32px)]">
        {/* Pane 1: Conversations List (Desktop ≥ 768px) */}
        <aside className="hidden md:flex md:w-[280px] lg:w-[320px] shrink-0 border-r border-border flex-col min-h-0 bg-surface">
          <ConversationList conversations={conversations} activeId={conv?.id} />
        </aside>

        {/* Pane 2: Message Thread (Center) */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface relative">
          {/* Header */}
          <header className="px-3 sm:px-5 py-3 border-b border-border bg-surface flex items-center justify-between gap-3 shrink-0 relative z-10 shadow-2xs">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <Link
                href="/messages"
                className="md:hidden p-2 -ml-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg transition-colors"
                aria-label="Back to messages"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div className="relative shrink-0">
                <Link
                  href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })}
                  className="block shrink-0"
                >
                  <img
                    src={conv.avatar}
                    alt={conv.with}
                    className="w-10 h-10 rounded-full object-cover aspect-square border border-border"
                  />
                </Link>
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface"
                  title="Online"
                />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })}
                    className="text-sm font-bold text-text-primary hover:text-action truncate tracking-tight"
                  >
                    {conv.with}
                  </Link>
                  {conv.isMuted && (
                    <BellSlashIcon className="w-3.5 h-3.5 text-text-secondary" title="Muted" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Active now</span>
                  <span className="text-text-secondary/50">·</span>
                  <span className="truncate">Private consultation</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={openMeetScheduler}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-action hover:bg-action/10 transition-colors"
                title="Schedule Google Meet"
                aria-label="Schedule Google Meet"
              >
                <VideoIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                  showInfoPanel
                    ? "bg-action/10 text-action"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg"
                }`}
                title="Chat Details"
                aria-label="Toggle chat details"
              >
                <InfoIcon className="w-5 h-5" />
              </button>

              <div>
                <button
                  ref={threadMenuBtnRef}
                  type="button"
                  onClick={() => setShowThreadMenu((v) => !v)}
                  className="flex items-center justify-center w-9 h-9 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg transition-colors"
                  aria-label="More options"
                >
                  <DotsIcon className="w-4 h-4" />
                </button>
                <DropdownMenu
                  open={showThreadMenu}
                  onClose={() => setShowThreadMenu(false)}
                  triggerRef={threadMenuBtnRef}
                  align="right"
                  width={210}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowThreadMenu(false);
                      openMeetScheduler();
                    }}
                    className="w-full text-left px-3.5 py-2.5 min-h-[44px] flex items-center text-xs font-medium text-text-primary hover:bg-bg gap-2"
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
                      className="w-full text-left px-3.5 py-2.5 min-h-[44px] flex items-center text-xs font-medium text-error hover:bg-error/10 gap-2"
                    >
                      <GoogleIcon className="w-4 h-4" />
                      <span>Disconnect Google</span>
                    </button>
                  ) : (
                    <a
                      href={`/meet/connect?return_to=${encodeURIComponent(window.location.pathname)}`}
                      className="w-full text-left px-3.5 py-2.5 min-h-[44px] flex items-center text-xs font-medium text-text-primary hover:bg-bg gap-2"
                    >
                      <GoogleIcon className="w-4 h-4" />
                      <span>Connect Google</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowThreadMenu(false);
                      if (conv?.id)
                        setReportTarget({
                          endpoint: `/conversations/${conv.id}/report`,
                          title: "Report conversation",
                        });
                    }}
                    className="w-full text-left px-3.5 py-2.5 min-h-[44px] flex items-center text-xs font-medium text-error hover:bg-error/10 gap-2"
                  >
                    <span>Report conversation</span>
                  </button>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Blocked banner notice */}
          {conv.isBlocked && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
              You cannot send messages to this conversation because communication has been blocked.
            </div>
          )}

          {/* Messages Scroll Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-bg/40 min-h-0">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-text-secondary">
                <div className="w-16 h-16 rounded-full bg-action/10 text-action grid place-items-center mb-3">
                  <img
                    src={conv.avatar}
                    alt={conv.with}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <h3 className="text-base font-semibold text-text-primary">{conv.with}</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  This is the start of your private consultation thread with {conv.with}. Send a message to get started!
                </p>
              </div>
            )}

            {messages.map((m, idx) => {
              const isMe = m.from === "me";
              const prevMsg = messages[idx - 1];
              const showDate = isDifferentDay(m.rawTime || m.time, prevMsg?.rawTime || prevMsg?.time);
              const dateLabel = showDate ? getDateLabel(m.rawTime || m.time) : null;
              const extractedUrl = extractUrl(m.text);
              const isHighlighted = highlightedMsgId && Number(highlightedMsgId) === Number(m.id);
              const isLastMeMessage = idx === lastMeMsgIndex;

              return (
                <div key={m.id || idx} className="space-y-3">
                  {/* Date separator divider */}
                  {dateLabel && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider py-1 px-3.5 bg-surface rounded-full border border-border shadow-2xs">
                        {dateLabel}
                      </span>
                    </div>
                  )}

                  <div
                    id={`msg-${m.id}`}
                    className={`flex items-end gap-2 group transition-all duration-500 ${
                      isMe ? "justify-end" : "justify-start"
                    } ${isHighlighted ? "scale-[1.01]" : ""}`}
                  >
                    {/* Peer avatar beside them-messages */}
                    {!isMe && (
                      <img
                        src={conv.avatar}
                        alt={conv.with}
                        className="w-7 h-7 rounded-full object-cover mb-1 border border-border shrink-0 hidden sm:block"
                      />
                    )}

                    {/* Action buttons (Reply / Report) for 'me' */}
                    {isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => initiateReply(m)}
                          className="w-7 h-7 rounded-full bg-surface border border-border text-text-secondary hover:text-action grid place-items-center shadow-2xs hover:scale-105 transition-transform"
                          title="Reply"
                        >
                          <ReplyIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all ${
                        isMe
                          ? "bg-action text-white rounded-br-xs shadow-2xs"
                          : "bg-surface border border-border text-text-primary rounded-bl-xs shadow-2xs"
                      } ${
                        isHighlighted
                          ? "ring-4 ring-action/50 shadow-md ring-offset-2 ring-offset-surface"
                          : ""
                      }`}
                    >
                      {/* Quoted Message (Reply Preview Chip) */}
                      {m.replyTo && (
                        <button
                          type="button"
                          onClick={() => jumpToMessage(m.replyTo.id)}
                          className={`w-full text-left mb-2.5 p-2 rounded-xl text-xs border border-dashed transition-all flex items-start gap-2 ${
                            isMe
                              ? "bg-black/20 border-white/30 text-white/90 hover:bg-black/30"
                              : "bg-bg/80 border-border text-text-secondary hover:bg-bg hover:text-text-primary"
                          }`}
                          title="Jump to quoted message"
                        >
                          <ReplyIcon className="w-3.5 h-3.5 text-action shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[11px] block truncate">
                              {m.replyTo.senderName || "Quoted message"}
                            </span>
                            <span className="line-clamp-1 text-[11px] opacity-80">
                              {m.replyTo.text || (m.replyTo.mediaType ? `[${m.replyTo.mediaType}]` : "...")}
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Post/Story Attachment Card */}
                      {m.attachment && <QuoteCard quote={m.attachment} mode="inline" dark={isMe} />}

                      {/* Media (Image / Video / File) */}
                      {m.mediaUrl && (
                        <div className="mb-2">
                          {m.mediaType === "image" && (
                            <img
                              src={m.mediaUrl}
                              alt="attachment"
                              className="rounded-xl max-h-72 w-full object-cover border border-black/10"
                            />
                          )}
                          {m.mediaType === "video" && (
                            <video
                              src={m.mediaUrl}
                              controls
                              className="rounded-xl max-h-72 w-full bg-black border border-black/10"
                            />
                          )}
                          {m.mediaType === "file" && (
                            <a
                              href={m.mediaUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                isMe
                                  ? "bg-black/20 border-white/20 hover:bg-black/30 text-white"
                                  : "bg-bg border-border hover:bg-surface text-text-primary"
                              }`}
                            >
                              <FileIcon className="w-6 h-6 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">
                                  {m.mediaName || "Download File"}
                                </p>
                                {m.mediaSize && (
                                  <p
                                    className={`text-[10px] ${
                                      isMe ? "text-white/70" : "text-text-secondary"
                                    }`}
                                  >
                                    {(m.mediaSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Meeting Card */}
                      {(m.meetStatus || m.meetEventId || m.meetUrl) && (
                        <MeetingCard
                          message={m}
                          conversationId={conv.id}
                          isMe={isMe}
                          onCancelled={() => {
                            setMessages((prev) =>
                              prev.map((item) =>
                                item.id === m.id ? { ...item, meetStatus: "cancelled" } : item
                              )
                            );
                          }}
                        />
                      )}

                      {/* Poll Card */}
                      {m.poll && (
                        <div className="mb-2">
                          <PollCard
                            poll={m.poll}
                            dark={isMe}
                            onVote={handleVote}
                            onClose={handleClosePoll}
                          />
                        </div>
                      )}

                      {/* Insights Card */}
                      {m.insight && (
                        <div className="mb-2">
                          <InsightsCard insight={m.insight} dark={isMe} />
                        </div>
                      )}

                      {/* Message Text with Linkify */}
                      {m.text && (
                        <div className="whitespace-pre-wrap break-words">
                          {renderWithLinks(m.text, isMe)}
                        </div>
                      )}

                      {/* Link Preview Card */}
                      {extractedUrl && <LinkPreviewCard url={extractedUrl} dark={isMe} />}

                      {/* Timestamp & actions */}
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span
                          className={`text-[10px] font-medium ${
                            isMe ? "text-white/75" : "text-text-secondary"
                          }`}
                        >
                          {m.time}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Reply / Report) for 'them' */}
                    {!isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => initiateReply(m)}
                          className="w-7 h-7 rounded-full bg-surface border border-border text-text-secondary hover:text-action grid place-items-center shadow-2xs hover:scale-105 transition-transform"
                          title="Reply"
                        >
                          <ReplyIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReportTarget({
                              endpoint: `/messages/${m.id}/report`,
                              title: "Report message",
                            })
                          }
                          className="w-7 h-7 rounded-full bg-surface border border-border text-text-secondary hover:text-error grid place-items-center shadow-2xs hover:scale-105 transition-transform text-[11px]"
                          title="Report"
                        >
                          !
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Read Receipt ("Seen") for last 'me' message */}
                  {isMe && isLastMeMessage && conv.peerReadAt && (
                    <div className="flex items-center justify-end gap-1 px-1 -mt-1 text-[11px] text-text-secondary">
                      <CheckIcon className="w-3.5 h-3.5 text-action" />
                      <span>Seen</span>
                      <img
                        src={conv.avatar}
                        alt="Seen by"
                        className="w-3.5 h-3.5 rounded-full object-cover ml-0.5 border border-surface"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Attach Menu Dropdown Sheet */}
          {showAttachMenu && (
            <div className="p-3 bg-surface border-t border-border flex items-center gap-2 overflow-x-auto animate-in fade-in slide-in-from-bottom-2 shrink-0">
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
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
              >
                <ImageIcon className="w-5 h-5 text-action group-hover:scale-110 transition-transform" />
                <span>Photos</span>
                <span className="text-[10px] text-text-secondary font-normal">up to 20MB</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
              >
                <VideoIcon className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span>Videos</span>
                <span className="text-[10px] text-text-secondary font-normal">up to 100MB</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
              >
                <FileIcon className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Files</span>
                <span className="text-[10px] text-text-secondary font-normal">up to 25MB</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setShowPollModal(true);
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
              >
                <ChartIcon className="w-5 h-5 text-warning group-hover:scale-110 transition-transform" />
                <span>Poll</span>
                <span className="text-[10px] text-text-secondary font-normal">Vote in chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  openMeetScheduler();
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
              >
                <VideoIcon className="w-5 h-5 text-action group-hover:scale-110 transition-transform" />
                <span>Meet</span>
                <span className="text-[10px] text-text-secondary font-normal">Google Video</span>
              </button>
              {conv.isSeller && (
                <button
                  type="button"
                  onClick={handleShareInsights}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
                >
                  <ChartIcon className="w-5 h-5 text-success group-hover:scale-110 transition-transform" />
                  <span>Insights</span>
                  <span className="text-[10px] text-text-secondary font-normal">Brand metrics</span>
                </button>
              )}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={send}
            className="p-3 sm:p-4 bg-surface border-t border-border shrink-0 shadow-lg relative z-10"
          >
            {liveDown && (
              <p className="mb-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-1.5">
                Reconnecting… live updates paused, refreshing every 15s.
              </p>
            )}
            {typingName && !liveDown && (
              <p className="mb-2 text-xs text-text-secondary italic flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-action animate-ping" />
                {typingName} is typing…
              </p>
            )}

            {/* Reply Quote Strip */}
            {replyTo && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-bg border border-border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-action/10 text-action grid place-items-center shrink-0">
                    <ReplyIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary">
                      Replying to {replyTo.senderName}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate">{replyTo.text}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface transition-colors"
                  aria-label="Cancel reply"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pinned Quote Card */}
            {pinned && (
              <div className="mb-2 relative">
                <QuoteCard quote={pinned} mode="composer" />
                <button
                  type="button"
                  onClick={() => setPinned(null)}
                  className="absolute top-1.5 right-1.5 text-text-secondary hover:text-text-primary bg-surface/80 rounded-full p-0.5"
                  aria-label="Remove quote"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={conv.isBlocked}
                className="w-10 h-10 rounded-full border border-border bg-bg hover:bg-surface flex items-center justify-center text-text-secondary hover:text-action transition-colors shrink-0 disabled:opacity-50"
                aria-label="Attachments"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                name="text"
                required
                value={text}
                onChange={(e) => onType(e.target.value)}
                onBlur={handleBlur}
                placeholder={
                  conv.isBlocked
                    ? "Messaging is disabled"
                    : uploading
                    ? "Uploading attachment..."
                    : "Type a message..."
                }
                disabled={uploading || conv.isBlocked}
                className={getInputClass("text")}
              />
              <button
                type="submit"
                disabled={sending || uploading || !text.trim() || conv.isBlocked}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-semibold shrink-0 transition-colors shadow-sm"
              >
                Send
              </button>
            </div>
            {fieldErrors.text && (
              <p className="mt-1 text-xs text-error absolute ml-2">{fieldErrors.text}</p>
            )}
          </form>
        </main>

        {/* Pane 3: Chat Info Panel (Desktop ≥ 1024px inline, Drawer overlay on smaller screens) */}
        {showInfoPanel && (
          <>
            {/* Desktop Pane (≥ 1024px) */}
            <aside className="hidden lg:flex lg:w-[320px] shrink-0 border-l border-border flex-col min-h-0 bg-surface">
              <ChatInfoPanel
                conv={conv}
                onClose={() => setShowInfoPanel(false)}
                onSearchJump={jumpToMessage}
                onMuteToggled={(muted) => setConv((c) => (c ? { ...c, isMuted: muted } : c))}
                onBlockToggled={(blocked) => setConv((c) => (c ? { ...c, isBlocked: blocked } : c))}
              />
            </aside>

            {/* Mobile / Tablet Drawer Overlay (< 1024px) */}
            <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
              <div
                className="w-full max-w-sm sm:max-w-md h-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-200"
                role="dialog"
                aria-label="Conversation details"
              >
                <ChatInfoPanel
                  conv={conv}
                  onClose={() => setShowInfoPanel(false)}
                  onSearchJump={(msgId) => {
                    setShowInfoPanel(false);
                    jumpToMessage(msgId);
                  }}
                  onMuteToggled={(muted) => setConv((c) => (c ? { ...c, isMuted: muted } : c))}
                  onBlockToggled={(blocked) => setConv((c) => (c ? { ...c, isBlocked: blocked } : c))}
                />
              </div>
            </div>
          </>
        )}
      </div>

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
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Start Date & Time (Local)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={meetDate}
                  onChange={(e) => setMeetDate(e.target.value)}
                  min={new Date(Date.now() + 15 * 60000 - new Date().getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)}
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

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          endpoint={reportTarget.endpoint}
          title={reportTarget.title}
        />
      )}
    </div>
  );
}
