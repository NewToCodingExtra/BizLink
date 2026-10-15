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
    <div className="max-w-[1440px] mx-auto px-0 sm:px-4 py-0 sm:py-4 min-h-[calc(100dvh-64px)]">
      <Head title="Chats · Messages" />
      <div className="flex bg-surface sm:rounded-2xl sm:border sm:border-border sm:shadow-sm overflow-hidden h-[calc(100dvh-64px)] sm:h-[calc(100dvh-64px-32px)]">
        {/* Left: contacts list — full width on mobile, 320px sidebar on desktop */}
        <aside className="w-full md:w-[280px] lg:w-[320px] md:shrink-0 md:border-r md:border-border flex flex-col min-h-0 bg-surface">
          <ConversationList conversations={conversations} activeId={null} />
        </aside>

        {/* Right: empty state — desktop only */}
        <section className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-10 bg-bg/40">
          <div className="w-16 h-16 rounded-2xl bg-action/10 text-action grid place-items-center mb-4 shadow-2xs">
            <CommentIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Your Messages</h2>
          <p className="text-sm text-text-secondary mt-1.5 max-w-sm leading-relaxed">
            Select a conversation on the left to start chatting, share files, create polls, or schedule video consultations.
          </p>
          {first && (
            <Link
              href={threadHref(first)}
              className="mt-6 px-6 py-2.5 rounded-full bg-action hover:bg-action-hover text-white text-sm font-semibold transition-all shadow-sm hover:shadow"
            >
              Open latest chat · {first.with}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}

