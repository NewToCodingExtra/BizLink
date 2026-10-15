import { useState } from "react";
import { Link } from "@inertiajs/react";
import { ChevronRightIcon, SearchIcon, XIcon, BellSlashIcon } from "./icons";
import { profilePath } from "../utils/profilePath";

export function threadHref(c) {
  if (!c) return "/messages";
  return `/messages/${c.id || c.withUsername || c.brandId}`;
}

export default function ConversationList({ conversations = [], activeId = null, compact = false }) {
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? conversations.filter((c) =>
        `${c.with || ""} ${c.lastMessage || ""} ${c.withUsername || ""}`
          .toLowerCase()
          .includes(q.trim().toLowerCase())
      )
    : conversations;

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface">
      {!compact && (
        <div className="p-3 sm:p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Chats</h1>
            <span className="text-xs font-medium text-text-secondary px-2 py-0.5 rounded-full bg-bg border border-border">
              {conversations.length}
            </span>
          </div>
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 rounded-full border border-border bg-bg text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 rounded-full hover:bg-surface transition-colors"
                aria-label="Clear search"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-border/40 min-h-0">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-text-secondary flex flex-col items-center justify-center">
            <p className="font-medium text-text-primary mb-1">
              {conversations.length === 0 ? "No conversations yet" : "No results found"}
            </p>
            <p className="text-xs">
              {conversations.length === 0
                ? "Tap Inquire on any opportunity or card to start a chat."
                : `No chat matches "${q}".`}
            </p>
          </div>
        )}
        {filtered.map((c) => {
          const isActive = activeId != null && Number(c.id) === Number(activeId);
          const hasUnread = Number(c.unread) > 0;
          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-3 sm:px-4 sm:py-3 transition-colors ${
                isActive
                  ? "bg-action/10 border-l-4 border-l-action"
                  : "hover:bg-bg/70 border-l-4 border-l-transparent"
              }`}
            >
              <div className="relative shrink-0">
                <Link
                  href={profilePath({ username: c.withUsername, authorId: c.withId, brandId: c.brandId })}
                  className="block shrink-0"
                  title={`View ${c.with}`}
                >
                  <img
                    src={c.avatar}
                    alt={c.with}
                    className="w-12 h-12 rounded-full object-cover bg-bg border border-border"
                  />
                </Link>
                {/* Active presence dot */}
                {(c.isOnline || isActive) && (
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface"
                    title="Online"
                  />
                )}
              </div>

              <Link href={threadHref(c)} className="flex-1 min-w-0 flex items-center gap-2 group" preserveScroll>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-sm truncate ${
                        hasUnread ? "font-bold text-text-primary" : "font-semibold text-text-primary"
                      }`}
                    >
                      {c.with}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.isMuted && (
                        <BellSlashIcon className="w-3.5 h-3.5 text-text-secondary" title="Muted" />
                      )}
                      {c.time && (
                        <span className="text-[11px] text-text-secondary font-normal">
                          {c.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        hasUnread
                          ? "font-semibold text-text-primary"
                          : "text-text-secondary group-hover:text-text-primary transition-colors"
                      }`}
                    >
                      {c.lastMessage || "Start the conversation..."}
                    </p>
                    {hasUnread && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-action text-white text-[10px] font-bold grid place-items-center">
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-text-secondary/50 group-hover:text-text-secondary transition-colors shrink-0 hidden sm:inline-block">
                  <ChevronRightIcon className="w-4 h-4" />
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

