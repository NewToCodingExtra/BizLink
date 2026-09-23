import { useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ChevronRightIcon } from "../Components/icons";
import { getEcho } from "../utils/echo";
import { profilePath } from "../utils/profilePath";

export default function MessagesInbox({ conversations = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;

  // Live: refresh previews when a new inquiry/message notification lands.
  useEffect(() => {
    if (!user) return;
    const client = getEcho();
    if (!client) return;
    const channel = client.private(`user.${user.id}`);
    channel.listen(".notification.created", (e) => {
      const t = e?.notification?.type;
      if (t === "inquiry" || t === "comment" || t === "comment_reply") {
        router.reload({ only: ["conversations"] });
      }
    });
    return () => client.leave(`user.${user.id}`);
  }, [user?.id]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-64px)]">
      <Head title="Consultation Inbox" />
      <h1 className="text-2xl font-semibold text-text-primary">Consultation Inbox</h1>
      <p className="text-sm text-text-secondary mt-1">Private buyer–seller threads from MySQL. Separate from public comments.</p>
      <div className="mt-6 bg-surface rounded-xl border border-border shadow-sm divide-y divide-slate-100 overflow-hidden">
        {conversations.length === 0 && <p className="p-8 text-center text-sm text-text-secondary">No conversations yet — tap Inquire on any card.</p>}
        {conversations.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-4 hover:bg-bg transition-colors">
            <Link href={profilePath({ username: c.withUsername, authorId: c.withId, brandId: c.brandId })} className="shrink-0" title={`View ${c.with}`}>
              <img src={c.avatar} alt={c.with} className="w-10 h-10 rounded-full" />
            </Link>
            <Link href={`/messages/${c.withUsername || c.brandId}`} className="flex-1 min-w-0 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{c.with}</span>
                  {c.unread > 0 && <span className="w-2 h-2 rounded-full bg-action"></span>}
                </div>
                <p className="text-sm text-text-secondary truncate">{c.lastMessage}</p>
              </div>
              <span className="text-text-secondary"><ChevronRightIcon className="w-4 h-4" /></span>
            </Link>
          </div>
        ))}
      </div>
      {conversations.length > 0 && (
        <p className="text-center text-xs text-text-secondary mt-4">{conversations.length} thread{conversations.length !== 1 ? "s" : ""} · No more messages below.</p>
      )}
    </div>
  );
}
