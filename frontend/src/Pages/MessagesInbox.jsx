import { useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { getEcho } from "../utils/echo";
import ConversationList, { threadHref } from "../components/ConversationList";
import { CommentIcon } from "../components/icons";

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
      if (t === "inquiry" || t === "comment" || t === "comment_reply" || t === "poll_closed") {
        router.reload({ only: ["conversations"] });
      }
    });
    return () => client.leave(`user.${user.id}`);
  }, [user?.id]);

  const first = conversations[0];

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-6 py-0 sm:py-6 min-h-[calc(100vh-64px)]">
      <Head title="Messages" />
      <div className="flex bg-surface sm:rounded-xl sm:border sm:border-border sm:shadow-sm overflow-hidden min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-64px-48px)] sm:h-[calc(100vh-64px-48px)]">
        {/* Left: contacts list — full width on mobile, 340px sidebar on desktop */}
        <aside className="w-full md:w-[340px] md:shrink-0 md:border-r md:border-border flex flex-col min-h-[calc(100vh-64px)] md:min-h-0">
          <ConversationList conversations={conversations} activeId={null} />
        </aside>

        {/* Right: empty state — desktop only */}
        <section className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-10 bg-bg/50">
          <div className="w-16 h-16 rounded-2xl bg-action/10 text-action grid place-items-center mb-4">
            <CommentIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Select a conversation</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-xs">
            Choose a supplier or buyer on the left to open their chat. New inquiries from the feed land here.
          </p>
          {first && (
            <Link
              href={threadHref(first)}
              className="mt-5 px-5 py-2.5 rounded-full bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors"
            >
              Open latest chat — {first.with}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
