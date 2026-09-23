import { useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import markUrl from "../assets/bizlink-mark.svg";
import { httpApi } from "../utils/http";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";
import Button from "./Button";

export default function Navbar() {
  const { auth, flash } = usePage().props;
  const user = auth?.user ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const url = usePage().url;
  const pathname = url.split("?")[0];
  const { isDark, setIsDark } = useTheme();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    httpApi
      .get("/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]));
  }, [user, url]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id) => {
    try {
      await httpApi.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
    } catch {
      // keep local state unchanged on failure
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    setShowBell(false);
    setMobileOpen(false);
    setShowLogoutConfirm(false);
    router.post("/logout");
  };

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-150 ${pathname === path ? "text-white" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 bg-primary border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-4">
        <Link href={user ? "/feed" : "/"} className="flex items-center gap-2 shrink-0">
          <img src={markUrl} alt="BizLink" className="w-8 h-8 rounded-lg" />
          <span className="font-bold tracking-tight text-[18px]"><span className="text-white">Biz</span><span className="text-accent">Link</span></span>
          <span className="hidden sm:inline text-[10px] tracking-[0.18em] text-accent font-semibold ml-1">BRIDGING BRANDS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-6">
          {!user && <Link href="/" className={linkClass("/")}>Home</Link>}
          <Link href="/feed" className={linkClass("/feed")}>Feed</Link>
          <Link href="/about" className={linkClass("/about")}>About</Link>
          <Link href="/reels" className={linkClass("/reels")}>Reels</Link>
          {user && <Link href="/messages" className={linkClass("/messages")}>Messages</Link>}
        </nav>

        <div className="hidden md:block flex-1 max-w-[360px] ml-auto">
          <SearchBar onSearch={(q) => router.visit(`/search?q=${encodeURIComponent(q)}`)} />
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-surface/10 transition-colors mr-2"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {user ? (
            <Link href="/create" className="hidden sm:inline-flex items-center gap-1.5 bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
              <span className="text-lg leading-none -mt-0.5">+</span> Post
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-200 hover:text-white px-3 py-2">Log in</Link>
              <Link href="/register" className="hidden sm:inline-flex items-center bg-action hover:bg-action-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Sign up</Link>
            </>
          )}

          {user && (
            <div className="relative">
              <NotificationBell notifications={notifications} onToggle={() => setShowBell(!showBell)} />
              {showBell && (
                <div className="absolute right-0 mt-3 w-[340px] bg-surface rounded-xl shadow-md border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <p className="text-sm font-semibold text-text-primary">Notifications{unread > 0 ? ` (${unread})` : ""}</p>
                    <Link href="/notifications" onClick={() => setShowBell(false)} className="text-xs font-medium text-action hover:text-[#1D4ED8]">View all</Link>
                  </div>
                  <div className="max-h-[320px] overflow-auto divide-y divide-slate-50">
                    {notifications.length === 0 && <p className="p-6 text-sm text-text-secondary text-center">No notifications</p>}
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          setShowBell(false);
                          router.visit(n.link || "/notifications");
                        }}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-bg transition-colors ${!n.read ? "bg-action/10" : ""}`}
                      >
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-bg" : "bg-action"}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary leading-snug">{n.message}</p>
                          <p className="text-xs text-text-secondary mt-1">{n.timestamp}{n.link ? " · Tap to view →" : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && <ProfileMenu />}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-surface/10 transition-colors" aria-label="Menu">
            <span className="text-xl leading-none">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-primary px-4 py-4 space-y-3">
          <SearchBar onSearch={(q) => { setMobileOpen(false); router.visit(`/search?q=${encodeURIComponent(q)}`); }} />
          {user && (
            <div className="flex items-center gap-3 rounded-xl bg-surface/5 border border-white/10 px-3 py-2.5">
              <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-text-secondary truncate">{user.email}</p>
              </div>
              <Link href="/profile/edit" onClick={() => setMobileOpen(false)} className="text-xs font-medium text-accent hover:text-white shrink-0">Edit</Link>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {!user && <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-surface text-primary text-sm font-medium">Home</Link>}
            <Link href="/feed" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Feed</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">About</Link>
            <Link href="/reels" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Reels</Link>
            {user && <Link href="/messages" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Messages</Link>}
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Contact</Link>
            {!user && <Link href="/login" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Log in</Link>}
            {!user && <Link href="/register" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-action text-white text-sm">Sign up</Link>}
          </div>
          {user ? (
            <>
              <Link href="/create" onClick={() => setMobileOpen(false)} className="block text-center bg-action text-white rounded-lg py-2.5 text-sm font-medium">+ Post Opportunity</Link>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/profile/me" onClick={() => setMobileOpen(false)} className="block text-center border border-white/20 text-white rounded-lg py-2.5 text-sm">Profile</Link>
                <button onClick={() => setShowLogoutConfirm(true)} className="block w-full text-center bg-error/10 border border-error/20 text-error rounded-lg py-2.5 text-sm font-medium">Logout</button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Leaving so soon?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>Stay</Button>
            <Button variant="primary" onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Log out</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center pb-2">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-white/10" />
          ) : (
            <svg className="w-20 h-20 text-slate-400 mb-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 9.05v-.1"></path>
              <path d="M16 9.05v-.1"></path>
              <path d="M16 16c-1.5-1.5-3-1.5-6 0"></path>
            </svg>
          )}
          <p className="text-text-primary text-base font-medium">We'll miss you. Are you sure you want to log out?</p>
        </div>
      </Modal>
    </header>
  );
}
