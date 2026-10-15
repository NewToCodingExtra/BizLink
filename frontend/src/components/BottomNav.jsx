import { useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { can } from "../utils/can";
import { profilePath } from "../utils/profilePath";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";

function FeedIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function ReelsIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18" />
      <path d="m10 12.5 4 2-4 2v-4Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MessagesIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" />
    </svg>
  );
}

function ProfileIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function BottomNav() {
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user ?? null;
  const userId = user?.id ?? null;
  const url = page.url;
  const pathname = url.split("?")[0];
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);

  // Unread badge fetch only. Deps are stable primitives (userId, pathname),
  // never the referentially-unstable user/page/toast objects (toast-storm guard).
  // Interval + focus refetch: Reverb push may be offline (dev Tab 2), so the
  // badge must also converge by polling.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = () => {
      httpApi
        .get("/notifications")
        .then((res) => {
          if (!cancelled) setNotifications(res.data || []);
        })
        .catch(() => {
          if (!cancelled) setNotifications([]);
        });
    };
    load();
    const id = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", load);
    };
  }, [userId, pathname]);

  const unread = userId ? notifications.filter((n) => !n.read).length : 0;
  const canCreate = can(page, "opportunities.create");
  const profileHref = user ? profilePath(user) : "/profile/me";
  const isActive = (path) => pathname === path;
  const tabClass = (active) =>
    `relative flex flex-col items-center gap-0.5 py-2 mx-1 my-1 rounded-xl text-[11px] font-medium transition-colors duration-150 ${active ? "text-white bg-white/10" : "text-slate-300 hover:text-white hover:bg-white/5"}`;

  const gatedClass = tabClass(false);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={`grid ${canCreate ? "grid-cols-5" : "grid-cols-4"} px-2`}>
        <Link href="/feed" aria-current={isActive("/feed") ? "page" : undefined} className={tabClass(isActive("/feed"))}>
          <FeedIcon />
          <span>Feed</span>
        </Link>

        <Link href="/reels" aria-current={isActive("/reels") ? "page" : undefined} className={tabClass(isActive("/reels"))}>
          <ReelsIcon />
          <span>Reels</span>
        </Link>

        {canCreate && (
          <Link href="/create" aria-current={isActive("/create") ? "page" : undefined} className={tabClass(isActive("/create"))}>
            <span className="w-9 h-9 -mt-4 grid place-items-center rounded-full bg-action text-white text-2xl leading-none shadow-md">
              <span aria-hidden="true" className="-mt-0.5">+</span>
            </span>
            <span>Create</span>
          </Link>
        )}

        {user ? (
          <Link href="/messages" aria-current={isActive("/messages") ? "page" : undefined} className={tabClass(isActive("/messages"))}>
            <span className="relative">
              <MessagesIcon />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-error text-white text-[10px] font-bold leading-none">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>
            <span>Messages</span>
          </Link>
        ) : (
          <button type="button" onClick={() => toast.error("Log in to view messages.")} className={gatedClass} aria-label="Messages">
            <MessagesIcon />
            <span>Messages</span>
          </button>
        )}

        {user ? (
          <Link href={profileHref} aria-current={pathname.startsWith("/profile") ? "page" : undefined} className={tabClass(pathname.startsWith("/profile"))}>
            <ProfileIcon />
            <span>Profile</span>
          </Link>
        ) : (
          <button type="button" onClick={() => toast.error("Log in to view your profile.")} className={gatedClass} aria-label="Profile">
            <ProfileIcon />
            <span>Profile</span>
          </button>
        )}
      </div>
    </nav>
  );
}
