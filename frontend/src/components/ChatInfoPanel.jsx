import { useEffect, useState, useRef } from "react";
import { Link, router } from "@inertiajs/react";
import { profilePath } from "../utils/profilePath";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import Modal from "./Modal";
import Button from "./Button";
import ReportModal from "./ReportModal";
import MediaLightbox from "./MediaLightbox";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ChatInfoPanel({
  conv,
  messages = [],
  isOpen = false,
  onClose,
  isMuted: isMutedProp,
  onToggleMute,
  onMuteToggled,
  onSelectMessage,
  onSearchJump,
  onBlockToggled,
  className = "",
}) {
  const toast = useToast();
  const [isMuted, setIsMuted] = useState(isMutedProp ?? conv?.isMuted ?? false);

  useEffect(() => {
    setIsMuted(isMutedProp ?? conv?.isMuted ?? false);
  }, [isMutedProp, conv?.isMuted]);

  const handleToggleMute = async () => {
    if (onToggleMute) {
      onToggleMute();
      return;
    }
    if (!conv?.id) return;
    try {
      const res = await httpApi.post(`/conversations/${conv.id}/mute`);
      const nextMuted = Boolean(res.data?.muted);
      setIsMuted(nextMuted);
      if (onMuteToggled) onMuteToggled(nextMuted);
      toast.success(nextMuted ? "Conversation muted" : "Conversation unmuted");
    } catch {
      toast.error("Failed to update notification settings");
    }
  };

  const handleSelectMessage = (id) => {
    if (onSearchJump) onSearchJump(id);
    else if (onSelectMessage) onSelectMessage(id);
  };
  const [activeTab, setActiveTab] = useState("media"); // media, files, links
  const [mediaSubTab, setMediaSubTab] = useState("all"); // all, photo, video
  const [mediaItems, setMediaItems] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // In-conversation search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Lightbox preview for photos/videos
  const [lightboxItem, setLightboxItem] = useState(null);

  // Privacy actions
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(conv?.isBlocked || false);

  useEffect(() => {
    setIsBlocked(conv?.isBlocked || false);
  }, [conv?.isBlocked]);

  // Fetch media items whenever tab changes or conversation changes
  useEffect(() => {
    if (!conv?.id) return;
    let cancelled = false;
    setLoadingMedia(true);

    const typeParam = activeTab === "media"
      ? (mediaSubTab === "photo" ? "photo" : (mediaSubTab === "video" ? "video" : "media"))
      : (activeTab === "files" ? "file" : "link");

    httpApi.get(`/conversations/${conv.id}/media?type=${typeParam}`)
      .then((res) => {
        if (!cancelled) {
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          setMediaItems(list);
        }
      })
      .catch(() => {
        if (!cancelled) setMediaItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMedia(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conv?.id, activeTab, mediaSubTab, messages?.length]);

  // Handle in-conversation search debounce
  useEffect(() => {
    if (!searchOpen || !conv?.id) return;
    const q = searchQuery.trim();
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      httpApi.get(`/conversations/${conv.id}/messages/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          setSearchResults(list);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setSearching(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, conv?.id]);

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setSearchQuery("");
        setSearchResults([]);
      }
      return next;
    });
  };

  const handleBlockUser = async () => {
    if (!conv?.id) return;
    setBlocking(true);
    try {
      await httpApi.post(`/conversations/${conv.id}/block`);
      setIsBlocked(true);
      if (onBlockToggled) onBlockToggled(true);
      setShowBlockModal(false);
      toast.success(`${conv.with} has been blocked.`);
    } catch {
      toast.error("Failed to block user. Try again.");
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!conv?.id) return;
    setBlocking(true);
    try {
      await httpApi.post(`/conversations/${conv.id}/unblock`);
      setIsBlocked(false);
      if (onBlockToggled) onBlockToggled(false);
      toast.success(`${conv.with} has been unblocked.`);
    } catch {
      toast.error("Failed to unblock user. Try again.");
    } finally {
      setBlocking(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conv?.id) return;
    if (!window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) return;
    try {
      await httpApi.delete(`/conversations/${conv.id}`);
      toast.success("Conversation deleted");
      router.visit("/messages");
    } catch {
      toast.error("Failed to delete conversation.");
    }
  };

  const userProfileLink = profilePath({
    username: conv.withUsername,
    authorId: conv.withId,
    brandId: conv.brandId,
  });

  return (
    <div className={`flex flex-col h-full bg-surface border-l border-border overflow-y-auto pb-28 sm:pb-16 ${className}`}>
      {/* Header bar for mobile drawer close */}
      <div className="flex items-center justify-between p-3.5 border-b border-border lg:hidden shrink-0">
        <span className="text-sm font-semibold text-text-primary">Chat Details</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg transition-colors"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="p-5 flex flex-col items-center text-center border-b border-border/70 shrink-0">
        <div className="relative mb-2.5">
          <Link href={userProfileLink}>
            <img
              src={conv.avatar || "https://i.pravatar.cc/100?img=12"}
              alt={conv.with}
              className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-sm aspect-square"
            />
          </Link>
          <span
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface ${
              conv.isOnline ? "bg-emerald-500" : "bg-slate-400"
            }`}
            title={conv.isOnline ? "Active now" : (conv.lastActiveText || "Offline")}
          />
        </div>
        <Link href={userProfileLink} className="text-base font-bold text-text-primary hover:underline leading-tight min-h-0">
          {conv.with}
        </Link>
        {conv.withUsername && (
          <p className="text-xs text-text-secondary mt-0.5 leading-tight">@{conv.withUsername}</p>
        )}
        <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 justify-center leading-tight">
          <span className={`w-1.5 h-1.5 rounded-full ${conv.isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
          <span>{conv.isOnline ? "Active now" : (conv.lastActiveText || "Offline")}</span>
        </p>

        {/* Quick Action Icons Row */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-2">
          {/* Profile */}
          <Link
            href={userProfileLink}
            className="flex flex-col items-center gap-1 text-text-secondary hover:text-text-primary group"
          >
            <div className="w-10 h-10 rounded-full bg-bg border border-border group-hover:border-action/40 group-hover:bg-action/5 grid place-items-center transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[11px] font-medium">Profile</span>
          </Link>

          {/* Mute */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex flex-col items-center gap-1 text-text-secondary hover:text-text-primary group"
          >
            <div className={`w-10 h-10 rounded-full border grid place-items-center transition-colors ${
              isMuted
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                : "bg-bg border-border group-hover:border-action/40 group-hover:bg-action/5"
            }`}>
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9m-6-13l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </div>
            <span className="text-[11px] font-medium">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={handleToggleSearch}
            className="flex flex-col items-center gap-1 text-text-secondary hover:text-text-primary group"
          >
            <div className={`w-10 h-10 rounded-full border grid place-items-center transition-colors ${
              searchOpen
                ? "bg-action text-white border-action"
                : "bg-bg border-border group-hover:border-action/40 group-hover:bg-action/5"
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
                <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[11px] font-medium">Search</span>
          </button>
        </div>
      </div>

      {/* In-Conversation Search Collapsible Panel */}
      {searchOpen && (
        <div className="p-3.5 bg-bg/60 border-b border-border space-y-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-secondary outline-none focus:border-action focus:ring-1 focus:ring-action"
            />
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {searching && <p className="text-[11px] text-text-secondary py-1 text-center">Searching…</p>}

          {!searching && searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto divide-y divide-border/60 custom-scrollbar">
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => handleSelectMessage(res.id)}
                  className="w-full text-left py-2 px-1 hover:bg-surface/80 rounded transition-colors group"
                >
                  <p className="text-xs text-text-primary font-medium line-clamp-2 leading-relaxed">
                    {res.text}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{res.senderName} · {res.time}</p>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-[11px] text-text-secondary py-1 text-center">No messages found.</p>
          )}
        </div>
      )}

      {/* Tabbed Media, Files & Links Section */}
      <div className="p-4 border-b border-border flex-1 min-h-[220px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Shared Content</span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-bg rounded-lg mb-3">
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "media" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Media
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "files" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "links" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Links
          </button>
        </div>

        {/* Media Tab: Photos & Videos */}
        {activeTab === "media" && (
          <div>
            <div className="flex gap-2 mb-2.5 text-[11px]">
              <button
                onClick={() => setMediaSubTab("all")}
                className={`px-2 py-0.5 rounded-full border transition-colors ${
                  mediaSubTab === "all" ? "bg-action/10 border-action text-action font-semibold" : "border-border text-text-secondary"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMediaSubTab("photo")}
                className={`px-2 py-0.5 rounded-full border transition-colors ${
                  mediaSubTab === "photo" ? "bg-action/10 border-action text-action font-semibold" : "border-border text-text-secondary"
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setMediaSubTab("video")}
                className={`px-2 py-0.5 rounded-full border transition-colors ${
                  mediaSubTab === "video" ? "bg-action/10 border-action text-action font-semibold" : "border-border text-text-secondary"
                }`}
              >
                Videos
              </button>
            </div>

            {loadingMedia ? (
              <div className="grid grid-cols-3 gap-1.5 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-border/40 animate-pulse rounded-md" />
                ))}
              </div>
            ) : mediaItems.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No photos or videos shared yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLightboxItem(item)}
                    className="relative aspect-square rounded-md overflow-hidden bg-bg group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  >
                    {item.mediaType === "video" ? (
                      <>
                        <video src={item.mediaUrl} className="w-full h-full object-cover" preload="metadata" />
                        <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <img
                        src={item.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div>
            {loadingMedia ? (
              <p className="text-xs text-text-secondary py-4 text-center">Loading files…</p>
            ) : mediaItems.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No documents or files shared yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                {mediaItems.map((f) => (
                  <a
                    key={f.id}
                    href={f.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-bg/60 hover:bg-bg border border-border text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded bg-surface border border-border grid place-items-center shrink-0 text-text-secondary group-hover:text-action">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{f.mediaName || "Attachment"}</p>
                      <p className="text-[10px] text-text-secondary">{formatBytes(f.mediaSize)} · {f.time}</p>
                    </div>
                    <svg className="w-4 h-4 text-text-secondary group-hover:text-action shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div>
            {loadingMedia ? (
              <p className="text-xs text-text-secondary py-4 text-center">Loading links…</p>
            ) : mediaItems.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">No links shared in this conversation.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {mediaItems.map((item, idx) => (
                  <a
                    key={`${item.id}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-2.5 p-2 rounded-lg bg-bg/60 hover:bg-bg border border-border text-left transition-colors group"
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="w-12 h-12 rounded object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-surface border border-border grid place-items-center text-text-secondary shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{item.title || item.url}</p>
                      {item.description && (
                        <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <p className="text-[10px] text-action truncate mt-0.5">{item.siteName || item.url}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy & Support Actions */}
      <div className="p-4 space-y-2 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Privacy & Support</span>

        <div className="pt-1 space-y-1">
          <button
            type="button"
            onClick={handleToggleMute}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-bg text-left text-xs font-medium text-text-primary transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Mute notifications</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isMuted ? "bg-amber-500/10 text-amber-500" : "bg-bg text-text-secondary"
            }`}>
              {isMuted ? "Muted" : "Active"}
            </span>
          </button>

          {isBlocked ? (
            <button
              type="button"
              onClick={handleUnblockUser}
              disabled={blocking}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-action/10 text-left text-xs font-medium text-action transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>{blocking ? "Unblocking…" : "Unblock User"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowBlockModal(true)}
              disabled={blocking}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/10 text-left text-xs font-medium text-error transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>Block User</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteConversation}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-error/10 text-left text-xs font-medium text-error transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
            </svg>
            <span>Delete Conversation</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-bg text-left text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Report Conversation</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Interactive Media Lightbox */}
      <MediaLightbox
        isOpen={Boolean(lightboxItem)}
        onClose={() => setLightboxItem(null)}
        media={lightboxItem}
      />

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Block User"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowBlockModal(false)} disabled={blocking}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBlockUser} disabled={blocking}>
              {blocking ? "Blocking…" : "Block User"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary leading-relaxed">
          Are you sure you want to block <strong className="text-text-primary">{conv.with}</strong>? They will no longer be able to message you or reply in this consultation thread.
        </p>
      </Modal>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          endpoint={`/conversations/${conv.id}/report`}
          title="Report this conversation"
        />
      )}
    </div>
  );
}
