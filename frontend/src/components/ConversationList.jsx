import { useState } from "react";
import { Link } from "@inertiajs/react";
import { ChevronRightIcon } from "./icons";
import { profilePath } from "../utils/profilePath";

export function threadHref(c) {
  return `/messages/${c.withUsername || c.brandId}`;
}

export default function ConversationList({ conversations = [], activeId = null, compact = false }) {
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? conversations.filter((c) =>
        `${c.with || ""} ${c.lastMessage || ""}`.toLowerCase().includes(q.trim().toLowerCase())
      )
    : conversations;

  return (
    <div className="flex flex-col h-full min-h-0">
      {!compact && (
        <div className="p-3 sm:p-4 border-b border-border shrink-0">
          <h1 className="text-lg font-semibold text-text-primary">Messages</h1>
          <p className="text-xs text-text-secondary mt-0.5">Private buyer–seller threads</p>
          <div className="mt-3 relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg text-sm text-text-primary placeholder:text-text-secondary/70 outline-none focus:border-action focus:ring-2 focus:ring-action/20"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-text-secondary">
            {conversations.length === 0
              ? "No conversations yet — tap Inquire on any card."
              : "No matches for your search."}
          </p>
        )}
        {filtered.map((c) => {
          const isActive = activeId != null && Number(c.id) === Number(activeId);
          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-3 sm:p-4 transition-colors ${
                isActive ? "bg-action/10 border-l-2 border-l-action" : "hover:bg-bg border-l-2 border-l-transparent"
              }`}
            >
              <Link
                href={profilePath({ username: c.withUsername, authorId: c.withId, brandId: c.brandId })}
                className="shrink-0"
                title={`View ${c.with}`}
              >
                <img
                  src={c.avatar}
                  alt={c.with}
                  className="w-10 h-10 rounded-full object-cover bg-bg"
                />
              </Link>
              <Link href={threadHref(c)} className="flex-1 min-w-0 flex items-center gap-2" preserveScroll>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">{c.with}</span>
                    {c.unread > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-action text-white text-[10px] font-bold grid place-items-center">
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-text-secondary truncate mt-0.5">
                    {c.lastMessage || "Start the conversation..."}
                  </p>
                </div>
                <span className="text-text-secondary shrink-0">
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
