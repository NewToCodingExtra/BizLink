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
  PencilIcon,
  TrashIcon,
  FlagIcon,
  SmileIcon,
  ArrowUpIcon,
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
import MediaLightbox from "../components/MediaLightbox";
import LinkPreviewCard, { renderWithLinks, extractUrl } from "../components/LinkPreviewCard";
import { httpApi, csrfFetch } from "../utils/http";
import { getEcho, watchEchoHealth } from "../utils/echo";
import { profilePath } from "../utils/profilePath";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

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
  const [showInfoPanel, setShowInfoPanel] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [unblocking, setUnblocking] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setShowInfoPanel(false);
    }
  }, [conv?.id]);

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
  const [customMeetUrl, setCustomMeetUrl] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeReactId, setActiveReactId] = useState(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const whisperAt = useRef(0);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null);

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

    const handleIncomingMessage = (e) => {
      const msg = e?.message || e?.data || e;
      if (!msg || !msg.id) return;
      if (Number(msg.senderId) === Number(me?.id)) return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => Number(m.id) === Number(msg.id));
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...msg, from: "them" };
          return next;
        }
        return [...prev, { ...msg, from: "them" }];
      });
      // Acknowledge read in real time
      httpApi.post(`/conversations/${conv.id}/read`).catch(() => {});
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 30);
    };

    [
      ".message.sent",
      "message.sent",
      ".MessageSent",
      "MessageSent",
      ".message.created",
      "message.created",
      ".MessageCreated",
      "MessageCreated",
    ].forEach((ev) => channel.listen(ev, handleIncomingMessage));

    const handleDeletedMessage = (e) => {
      const deletedId = e?.messageId;
      if (!deletedId) return;
      setMessages((prev) => prev.filter((m) => Number(m.id) !== Number(deletedId)));
    };
    [".message.deleted", "message.deleted", ".MessageDeleted", "MessageDeleted"].forEach((ev) =>
      channel.listen(ev, handleDeletedMessage)
    );

    const handlePollUpdated = (e) => {
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
    };
    [".poll.updated", "poll.updated", ".PollUpdated", "PollUpdated"].forEach((ev) =>
      channel.listen(ev, handlePollUpdated)
    );

    const handlePollClosed = (e) => {
      const closedPoll = e?.poll;
      if (!closedPoll) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.poll && Number(m.poll.id) === Number(closedPoll.id)) {
            return { ...m, poll: { ...closedPoll, myVote: m.poll.myVote } };
          }
          return m;
        })
      );
    };
    [".poll.closed", "poll.closed", ".PollClosed", "PollClosed"].forEach((ev) =>
      channel.listen(ev, handlePollClosed)
    );

    const handleConversationRead = (e) => {
      if (e?.readAt && Number(e?.userId) !== Number(me?.id)) {
        setConv((prev) => (prev ? { ...prev, peerReadAt: e.readAt } : prev));
      }
    };
    [".conversation.read", "conversation.read", ".ConversationRead", "ConversationRead"].forEach((ev) =>
      channel.listen(ev, handleConversationRead)
    );

    const handleMeetScheduled = (e) => {
      const msg = e?.message;
      if (!msg || Number(msg.senderId) === Number(me?.id)) return;
      setMessages((prev) =>
        prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, { ...msg, from: "them" }]
      );
    };
    [".meet.scheduled", "meet.scheduled", ".MeetScheduled", "MeetScheduled"].forEach((ev) =>
      channel.listen(ev, handleMeetScheduled)
    );

    const handleMeetEnded = (e) => {
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
    };
    [".meet.ended", "meet.ended", ".MeetEnded", "MeetEnded"].forEach((ev) =>
      channel.listen(ev, handleMeetEnded)
    );

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

  // Close message action menus on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setActiveMenuId(null);
      setActiveReactId(null);
      setSelectedMsgId(null);
    };
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);


  // High-frequency, silent background AJAX message & presence sync (no page reloads)
  useEffect(() => {
    if (!conv?.id) return;
    let cancelled = false;

    const syncMessages = async () => {
      try {
        const res = await httpApi.get(`/conversations/${conv.id}`);
        if (cancelled) return;
        const freshConv = res.data ?? res;
        if (freshConv?.messages) {
          setMessages((prev) => {
            const freshMap = new Map(freshConv.messages.map((m) => [String(m.id), m]));
            let changed = false;

            // 1. Update existing messages in-place with fresh polls, reactions, edits, meeting status
            const updated = prev.map((m) => {
              const fresh = freshMap.get(String(m.id));
              if (!fresh) return m;

              const pollChanged = JSON.stringify(m.poll) !== JSON.stringify(fresh.poll);
              const reactionsChanged = JSON.stringify(m.reactions) !== JSON.stringify(fresh.reactions);
              const meetChanged = m.meetStatus !== fresh.meetStatus || m.meetUrl !== fresh.meetUrl;
              const textChanged = m.text !== fresh.text || m.isEdited !== fresh.isEdited;

              if (pollChanged || reactionsChanged || meetChanged || textChanged) {
                changed = true;
                return {
                  ...m,
                  ...fresh,
                  from: m.from,
                  poll: fresh.poll ? { ...fresh.poll, myVote: m.poll?.myVote ?? fresh.poll.myVote } : null,
                };
              }
              return m;
            });

            // 2. Append newly incoming messages
            const existingIds = new Set(prev.map((m) => String(m.id)));
            const newOnes = freshConv.messages.filter((m) => !existingIds.has(String(m.id)));
            if (newOnes.length > 0) {
              changed = true;
              return [...updated, ...newOnes];
            }
            return changed ? updated : prev;
          });
        }

        if (freshConv) {
          setConv((prev) => {
            if (!prev) return freshConv;
            if (
              prev.peerReadAt !== freshConv.peerReadAt ||
              prev.isOnline !== freshConv.isOnline ||
              prev.lastActiveText !== freshConv.lastActiveText ||
              prev.unread !== freshConv.unread
            ) {
              return { ...prev, ...freshConv };
            }
            return prev;
          });
        }
      } catch {
        // Silent catch on background network blips
      }
    };

    const intervalMs = 2500;
    const iv = setInterval(syncMessages, intervalMs);

    // Explicitly mark conversation as read on open
    httpApi.post(`/conversations/${conv.id}/read`).catch(() => {});

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [conv?.id]);

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

  const handleReact = async (m, emoji) => {
    setActiveReactId(null);
    try {
      const res = await httpApi.post(`/conversations/${conv.id}/messages/${m.id}/react`, { emoji });
      const updated = res.data ?? res;
      setMessages((prev) =>
        prev.map((x) => (Number(x.id) === Number(m.id) ? { ...x, ...updated } : x))
      );
    } catch (err) {
      toast.error(err.message || "Failed to react");
    }
  };

  const handleBumpMessage = async (m) => {
    setActiveMenuId(null);
    try {
      const res = await httpApi.post(`/conversations/${conv.id}/messages/${m.id}/bump`);
      const newMsg = res.data ?? res;
      setMessages((prev) => (prev.some((x) => Number(x.id) === Number(newMsg.id)) ? prev : [...prev, newMsg]));
      setConv((c) => (c ? { ...c, lastMessage: newMsg.text || "Bumped message" } : c));
      toast.success("Message bumped!");
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (err) {
      toast.error(err.message || "Failed to bump message");
    }
  };

  const startEditing = (m) => {
    setActiveMenuId(null);
    setEditingMessageId(m.id);
    setEditText(m.text || "");
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleSaveEdit = async (m) => {
    if (!editText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await httpApi.put(`/conversations/${conv.id}/messages/${m.id}`, {
        text: editText.trim(),
      });
      const updated = res.data ?? res;
      setMessages((prev) =>
        prev.map((x) => (Number(x.id) === Number(m.id) ? { ...x, ...updated } : x))
      );
      cancelEditing();
      toast.success("Message updated");
    } catch (err) {
      toast.error(err.message || "Failed to update message");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirm = useConfirm();

  const handleDeleteMessage = async (m) => {
    setActiveMenuId(null);
    const ok = await confirm({
      title: "Delete message?",
      message: "Are you sure you want to delete this message? It will be removed from this conversation.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await httpApi.delete(`/conversations/${conv.id}/messages/${m.id}`);
      setMessages((prev) => prev.filter((x) => Number(x.id) !== Number(m.id)));
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete message");
    }
  };

  const renderMessageActions = (m, isMe, idx) => {
    const isMenuOpen = activeMenuId === m.id;
    const isReactOpen = activeReactId === m.id;
    const isSelected = selectedMsgId === m.id;
    const openDownwards = idx < 2;

    return (
      <div
        className={`transition-opacity flex items-center gap-1 shrink-0 ${
          isMenuOpen || isReactOpen || isSelected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {/* 1. Reply Icon (Centered) */}
        <button
          type="button"
          onClick={() => initiateReply(m)}
          className="w-7 h-7 rounded-full bg-surface border border-border text-text-secondary hover:text-action hover:bg-bg grid place-items-center shadow-2xs hover:scale-105 transition-all"
          title="Reply"
        >
          <ReplyIcon className="w-3.5 h-3.5" />
        </button>

        {/* 2. React Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveReactId(isReactOpen ? null : m.id);
              setActiveMenuId(null);
            }}
            className={`w-7 h-7 rounded-full border grid place-items-center shadow-2xs hover:scale-105 transition-all ${
              isReactOpen
                ? "bg-action text-white border-action"
                : "bg-surface border-border text-text-secondary hover:text-action hover:bg-bg"
            }`}
            title="React"
          >
            <SmileIcon className="w-3.5 h-3.5" />
          </button>

          {/* Quick Emoji Reaction Bar */}
          {isReactOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute z-[70] ${
                openDownwards ? "top-full mt-1.5" : "bottom-full mb-1.5"
              } ${
                isMe ? "right-0" : "left-0"
              } p-1 bg-surface border border-border rounded-full shadow-2xl flex items-center gap-0.5 animate-in fade-in zoom-in-95 duration-150`}
            >
              {["❤️", "👍", "😂", "😮", "😢", "🔥"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(m, emoji)}
                  className={`w-7 h-7 rounded-full text-base grid place-items-center hover:scale-125 transition-transform hover:bg-bg ${
                    m.myReactions?.includes(emoji) ? "bg-action/20 ring-1 ring-action" : ""
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. More Actions (...) Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(isMenuOpen ? null : m.id);
              setActiveReactId(null);
            }}
            className={`w-7 h-7 rounded-full border grid place-items-center shadow-2xs hover:scale-105 transition-all ${
              isMenuOpen
                ? "bg-action text-white border-action"
                : "bg-surface border-border text-text-secondary hover:text-action hover:bg-bg"
            }`}
            title="More actions"
          >
            <DotsIcon className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Menu (Guaranteed to float on top with z-[70]) */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute z-[70] ${
                openDownwards ? "top-full mt-1.5" : "bottom-full mb-1.5"
              } ${
                isMe ? "right-0" : "left-0"
              } w-36 py-1 bg-surface border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-xs text-text-primary`}
            >
              {/* Bump: resending the exact message */}
              <button
                type="button"
                onClick={() => handleBumpMessage(m)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-bg text-left transition-colors font-medium text-text-primary"
              >
                <ArrowUpIcon className="w-3.5 h-3.5 text-action" />
                <span>Bump</span>
              </button>

              {/* Edit: message text editing for sender */}
              {isMe && m.text && (
                <button
                  type="button"
                  onClick={() => startEditing(m)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-bg text-left transition-colors font-medium text-text-primary"
                >
                  <PencilIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Edit</span>
                </button>
              )}

              {/* Delete: message deletion for sender */}
              {isMe && (
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(m)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 text-left transition-colors font-medium"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              {/* Report */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  setReportTarget({
                    endpoint: `/messages/${m.id}/report`,
                    title: "Report message",
                  });
                }}
                className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-rose-500/10 text-rose-500 text-left transition-colors font-medium ${
                  isMe ? "border-t border-border/50" : ""
                }`}
              >
                <FlagIcon className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleUnblock = async () => {
    if (!conv?.id || unblocking) return;
    setUnblocking(true);
    try {
      await httpApi.post(`/conversations/${conv.id}/unblock`);
      setConv((c) => (c ? { ...c, isBlocked: false } : c));
      toast.success("User unblocked");
    } catch (err) {
      toast.error(err.message || "Failed to unblock user");
    } finally {
      setUnblocking(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conv?.id || deletingConv) return;
    const ok = await confirm({
      title: "Delete Conversation",
      message: "Are you sure you want to delete this conversation? This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;

    setDeletingConv(true);
    try {
      await httpApi.delete(`/conversations/${conv.id}`);
      toast.success("Conversation deleted");
      router.visit("/messages");
    } catch (err) {
      toast.error(err.message || "Failed to delete conversation");
      setDeletingConv(false);
    }
  };

  const send = async (e) => {
    if (e) e.preventDefault();
    if (conv?.isBlocked) {
      toast.error("You cannot send messages in this conversation.");
      return;
    }
    if (!text.trim() || sending) return;
    setSending(true);

    const sentText = text.trim();
    const tempId = "temp_" + Date.now();
    const prevReplyTo = replyTo;
    const prevPinned = pinned;

    // Optimistic message displayed immediately
    const optimisticMsg = {
      id: tempId,
      text: sentText,
      from: "me",
      senderId: me?.id,
      createdAt: new Date().toISOString(),
      rawTime: new Date().toISOString(),
      time: "Just now",
      replyTo: prevReplyTo,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setPinned(null);
    setReplyTo(null);

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 20);

    try {
      const body = { text: sentText };
      if (prevReplyTo?.id) {
        body.reply_to_id = prevReplyTo.id;
      }
      if (prevPinned && !prevPinned.expired) {
        body.attachment = {
          type: prevPinned.kind === "story" ? "story" : "opportunity",
          id: prevPinned.id,
        };
      }
      const res = await httpApi.post(`/conversations/${conv.id}/messages`, body);
      const msg = res.data ?? res;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? msg : m)));
      setConv((c) => (c ? { ...c, lastMessage: sentText } : c));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(sentText);
      setReplyTo(prevReplyTo);
      setPinned(prevPinned);
      toast.error(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e, category = null) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (conv?.isBlocked) {
      toast.error("You cannot send messages in this conversation.");
      if (e.target) e.target.value = "";
      return;
    }

    const mime = file.type || "";
    const name = file.name.toLowerCase();

    // Strict client-side file type enforcement
    if (category === "image") {
      const isImg = mime.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(name);
      if (!isImg) {
        toast.error("Please select a photo (JPG, PNG, WebP, GIF).");
        if (e.target) e.target.value = "";
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Photos must be under 20MB.");
        if (e.target) e.target.value = "";
        return;
      }
    } else if (category === "video") {
      const isVid = mime.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(name);
      if (!isVid) {
        toast.error("Please select a video file (MP4, MOV, WebM).");
        if (e.target) e.target.value = "";
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Videos must be under 100MB.");
        if (e.target) e.target.value = "";
        return;
      }
    } else if (category === "file") {
      const isMedia = mime.startsWith("image/") || mime.startsWith("video/") || /\.(jpe?g|png|webp|gif|mp4|mov|webm)$/i.test(name);
      if (isMedia) {
        toast.error("Please select a document or archive file (.pdf, .doc, .xls, .txt, .zip). Use Photos or Videos to send media.");
        if (e.target) e.target.value = "";
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Files must be under 25MB.");
        if (e.target) e.target.value = "";
        return;
      }
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
      if (e.target) e.target.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
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
      const payload = {
        title: meetTitle || `Consultation: ${conv.with}`,
        start_at: new Date(meetDate).toISOString(),
        duration: Number(meetDuration),
      };
      if (customMeetUrl.trim()) {
        const cleanCustom = customMeetUrl.trim();
        if (cleanCustom.toLowerCase().includes("meet.google.com/new")) {
          toast.error("Please open meet.google.com/new, start the call, and copy the room URL (e.g. https://meet.google.com/xxx-yyyy-zzz) from your address bar.");
          setSchedulingMeet(false);
          return;
        }
        payload.custom_meet_url = cleanCustom;
      }
      const res = await httpApi.post(`/conversations/${conv.id}/meet`, payload);
      const msg = res.data ?? res;
      setMessages((prev) => (prev.some((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, msg]));
      setConv((c) => (c ? { ...c, lastMessage: `Meeting scheduled: ${meetTitle || conv.with}` } : c));
      setShowMeetModal(false);
      setCustomMeetUrl("");
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
      await httpApi.post(`/conversations/${conv.id}/polls`, {
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
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
                    conv.isOnline ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  title={conv.isOnline ? "Active now" : (conv.lastActiveText || "Offline")}
                />
              </div>

              <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5 leading-tight">
                <div className="flex items-center gap-2">
                  <Link
                    href={profilePath({ username: conv.withUsername, authorId: conv.withId, brandId: conv.brandId })}
                    className="text-sm font-bold text-text-primary hover:text-action truncate tracking-tight inline-block min-h-0 py-0 leading-tight"
                  >
                    {conv.with}
                  </Link>
                  {conv.isMuted && (
                    <BellSlashIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" title="Muted" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0 leading-none">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      conv.isOnline ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="truncate">
                    {conv.isOnline ? "Active now" : (conv.lastActiveText || "Offline")}
                  </span>
                  <span className="hidden sm:inline text-text-secondary/50">·</span>
                  <span className="hidden sm:inline truncate">Private consultation</span>
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
                    onClick={() => setSelectedMsgId((cur) => (cur === m.id ? null : m.id))}
                    className={`flex items-center gap-2 group transition-all duration-300 relative ${
                      activeMenuId === m.id || activeReactId === m.id || selectedMsgId === m.id
                        ? "z-30"
                        : "z-0"
                    } ${isMe ? "justify-end" : "justify-start"} ${isHighlighted ? "scale-[1.01]" : ""}`}
                  >
                    {/* Peer avatar beside them-messages */}
                    {!isMe && (
                      <img
                        src={conv.avatar}
                        alt={conv.with}
                        className="w-7 h-7 rounded-full object-cover self-end mb-1 border border-border shrink-0 hidden sm:block"
                      />
                    )}

                    {/* Action buttons (Reply, React, More) for 'me' */}
                    {isMe && renderMessageActions(m, true, idx)}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all ${
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
                            <button
                              type="button"
                              onClick={() =>
                                setActiveLightboxMedia({
                                  mediaUrl: m.mediaUrl,
                                  mediaType: "image",
                                  mediaName: m.mediaName || "Photo",
                                  time: m.time,
                                })
                              }
                              className="block w-full text-left rounded-xl overflow-hidden border border-black/10 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                            >
                              <img
                                src={m.mediaUrl}
                                alt="attachment"
                                className="rounded-xl max-h-72 w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                              />
                            </button>
                          )}
                          {m.mediaType === "video" && (
                            <div className="relative rounded-xl overflow-hidden border border-black/10 group">
                              <video
                                src={m.mediaUrl}
                                controls
                                className="rounded-xl max-h-72 w-full bg-black"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveLightboxMedia({
                                    mediaUrl: m.mediaUrl,
                                    mediaType: "video",
                                    mediaName: m.mediaName || "Video",
                                    time: m.time,
                                  })
                                }
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs transition-colors backdrop-blur-xs flex items-center gap-1 shadow-md"
                                title="Expand video"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                <span className="text-[10px] font-medium">Zoom</span>
                              </button>
                            </div>
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
                          onUpdated={(updated) => {
                            setMessages((prev) =>
                              prev.map((item) =>
                                Number(item.id) === Number(m.id)
                                  ? {
                                      ...item,
                                      meetUrl: updated.meetUrl || updated.meet_url || item.meetUrl,
                                      ...updated,
                                    }
                                  : item
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

                      {/* Message Text with Linkify OR Inline Edit Form */}
                      {editingMessageId === m.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEdit(m);
                          }}
                          className="space-y-2 mt-1"
                        >
                          <textarea
                            rows={2}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(m);
                              } else if (e.key === "Escape") {
                                cancelEditing();
                              }
                            }}
                            className="w-full p-2 text-sm rounded-lg border outline-none bg-black/20 border-white/30 text-white placeholder-white/50 focus:border-white resize-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-2.5 py-1 rounded-md border border-white/30 text-white hover:bg-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingEdit || !editText.trim()}
                              className="px-2.5 py-1 rounded-md bg-white text-action hover:bg-slate-100 font-semibold disabled:opacity-50"
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        m.text && (
                          <div className="whitespace-pre-wrap break-words">
                            {renderWithLinks(m.text, isMe)}
                          </div>
                        )
                      )}

                      {/* Link Preview Card */}
                      {extractedUrl && <LinkPreviewCard url={extractedUrl} dark={isMe} />}

                      {/* Reaction Badges on Message Bubble */}
                      {m.reactions && Object.keys(m.reactions).length > 0 && (
                        <div
                          className={`flex flex-wrap items-center gap-1 mt-1.5 -mb-0.5 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {Object.entries(m.reactions).map(([emoji, count]) => {
                            const isMine = m.myReactions?.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(m, emoji)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs shadow-2xs transition-all border ${
                                  isMe
                                    ? isMine
                                      ? "bg-white/30 border-white/40 text-white font-bold"
                                      : "bg-white/15 border-white/20 text-white"
                                    : isMine
                                    ? "bg-action/15 border-action/30 text-action font-bold"
                                    : "bg-surface border-border text-text-primary"
                                }`}
                                title={isMine ? "Remove reaction" : "React"}
                              >
                                <span>{emoji}</span>
                                <span className="text-[11px] font-medium">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp & edited indicator */}
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span
                          className={`text-[10px] font-medium ${
                            isMe ? "text-white/75" : "text-text-secondary"
                          }`}
                        >
                          {m.time}
                          {m.isEdited && <span className="ml-1 opacity-75">(edited)</span>}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (Reply, React, More) for 'them' */}
                    {!isMe && renderMessageActions(m, false, idx)}
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
              {/* Separate hidden inputs for strict file-type enforcement */}
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileUpload(e, "image")}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
              <input
                type="file"
                ref={videoInputRef}
                onChange={(e) => handleFileUpload(e, "video")}
                className="hidden"
                accept="video/mp4,video/quicktime,video/webm"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e, "file")}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              />

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-bg hover:bg-surface text-text-primary text-xs font-medium min-w-[76px] flex-1 transition-colors group"
              >
                <ImageIcon className="w-5 h-5 text-action group-hover:scale-110 transition-transform" />
                <span>Photos</span>
                <span className="text-[10px] text-text-secondary font-normal">up to 20MB</span>
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
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

          {/* Composer or Messenger-style Blocked Card */}
          {conv.isBlocked ? (
            <div className="p-4 sm:p-5 bg-surface border-t border-border shrink-0 text-center shadow-lg relative z-10">
              <div className="max-w-md mx-auto flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-error/10 text-error flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-text-primary">You cannot message this account</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">
                  Direct communication in this thread has been blocked. You can unblock this user to resume chatting, or delete this conversation.
                </p>
                <div className="flex items-center justify-center gap-2.5 mt-3.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleUnblock}
                    disabled={unblocking}
                    className="px-4 py-2 rounded-full bg-action hover:bg-action-hover text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{unblocking ? "Unblocking..." : "Unblock User"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConversation}
                    disabled={deletingConv}
                    className="px-4 py-2 rounded-full border border-error/30 hover:bg-error/10 text-error text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{deletingConv ? "Deleting..." : "Delete Conversation"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                    uploading
                      ? "Uploading attachment..."
                      : "Type a message..."
                  }
                  disabled={uploading}
                  className={getInputClass("text")}
                />
                <button
                  type="submit"
                  disabled={sending || uploading || !text.trim()}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-action hover:bg-action-hover disabled:bg-blue-300 text-white text-sm font-semibold shrink-0 transition-colors shadow-sm"
                >
                  Send
                </button>
              </div>
              {fieldErrors.text && (
                <p className="mt-1 text-xs text-error absolute ml-2">{fieldErrors.text}</p>
              )}
            </form>
          )}
        </main>

        {/* Pane 3: Chat Info Panel (Desktop ≥ 1024px inline, Drawer overlay on smaller screens) */}
        {showInfoPanel && (
          <>
            {/* Desktop Pane (≥ 1024px) */}
            <aside className="hidden lg:flex lg:w-[320px] shrink-0 border-l border-border flex-col min-h-0 bg-surface">
              <ChatInfoPanel
                conv={conv}
                messages={messages}
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
                  messages={messages}
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
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none"
                />
                <p className="text-[11px] text-text-secondary mt-1">Select meeting start time.</p>
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
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-secondary">
                    Custom Meeting Link (Optional)
                  </label>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-action hover:underline flex items-center gap-1 font-medium"
                  >
                    Open meet.google.com/new ↗
                  </a>
                </div>
                <input
                  type="url"
                  value={customMeetUrl}
                  onChange={(e) => setCustomMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz or any meeting link"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  Leave empty to automatically generate an instant video consultation room (or Google Meet if account connected). You can also paste any active Google Meet, Zoom, or Teams URL.
                </p>
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
            <div className="pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  setShowConnectModal(false);
                  setShowMeetModal(true);
                }}
                className="text-xs text-action hover:underline font-medium"
              >
                Or schedule manually with a custom meeting link →
              </button>
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

      {/* Fullscreen Interactive Media Lightbox */}
      <MediaLightbox
        isOpen={Boolean(activeLightboxMedia)}
        onClose={() => setActiveLightboxMedia(null)}
        media={activeLightboxMedia}
      />
    </div>
  );
}
