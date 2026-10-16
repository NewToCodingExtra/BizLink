import { useEffect, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { can, hasRole } from "../utils/can";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import markUrl from "../assets/bizlink-mark.svg";
import { httpApi } from "../utils/http";
import { getEcho } from "../utils/echo";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";
import Button from "./Button";
import { XIcon, MenuIcon, ArrowRightIcon } from "./icons";
import VerificationRevokedModal from "./VerificationRevokedModal";
import { useScrollDirection } from "../utils/useScrollDirection";

export default function Navbar() {
  const isHidden = useScrollDirection();
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user ?? null;
  const userId = user?.id;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [selectedRevocationNotif, setSelectedRevocationNotif] = useState(null);
  const url = page.url;
  const pathname = url.split("?")[0];
  const { isDark, setIsDark } = useTheme();

  // Reset notifications during render when logged out (avoids set-state-in-effect).
  if (!user && notifications.length > 0) {
    setNotifications([]);
  }

  // Fetch + 30s poll + focus refetch: Reverb push may be offline (dev Tab 2),
  // so the bell must converge by polling too. Deps are stable (user, url).
  useEffect(() => {
    if (!user) return;
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
  }, [user, url]);

  // Live bell bump on new notifications.
  useEffect(() => {
    if (!userId) return;
    const client = getEcho();
    if (!client) return;
    const channel = client.private(`user.${userId}`);
    channel.listen(".notification.created", (e) => {
      const n = e?.notification;
      if (!n || n.read) return;
      setNotifications((prev) => (
        prev.some((x) => String(x.id) === String(n.id))
          ? prev
          : [{ ...n, read: false }, ...prev].slice(0, 20)
      ));
    });
    return () => client.leave(`user.${userId}`);
  }, [userId]);

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
    `inline-flex items-center min-h-[44px] px-1 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:rounded ${pathname === path ? "text-white" : "text-slate-300 hover:text-white active:text-white"}`;

  return (
    <header
      className={`sticky top-0 z-40 bg-primary border-b border-white/10 pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-in-out ${
        isHidden && !mobileOpen ? "-translate-y-full md:translate-y-0" : "translate-y-0"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[64px] py-2 flex items-center gap-3 sm:gap-4">
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
          {user && hasRole(page, "Admin") && <Link href="/admin" className={linkClass("/admin")}>Admin</Link>}
        </nav>

        <div className="hidden md:block flex-1 max-w-[360px] ml-auto">
          <SearchBar onSearch={(q) => router.visit(`/search?q=${encodeURIComponent(q)}`)} />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto md:ml-0 shrink-0">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-11 h-11 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-surface/10 active:bg-surface/15 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {user ? (
            can(page, "opportunities.create") && (
              <Link href="/create" className="hidden sm:inline-flex items-center gap-1.5 bg-action hover:bg-action-hover active:bg-[#1E40AF] active:scale-[0.98] text-white text-sm font-medium px-4 min-h-[44px] py-2 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
                <span className="text-lg leading-none -mt-0.5">+</span> Post
              </Link>
            )
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg border border-white/30 text-sm font-medium text-white hover:bg-white/10 active:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Log in</Link>
              <Link href="/register" className="hidden sm:inline-flex items-center min-h-[44px] bg-action hover:bg-action-hover active:scale-[0.98] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Sign up</Link>
            </>
          )}

          {user && (
            <div className="relative">
              <NotificationBell notifications={notifications} onToggle={() => setShowBell(!showBell)} />
              {showBell && (
                <div className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[340px] bg-surface rounded-xl shadow-md border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <p className="text-sm font-semibold text-text-primary">Notifications{unread > 0 ? ` (${unread})` : ""}</p>
                    <Link href="/notifications" onClick={() => setShowBell(false)} className="text-xs font-medium text-action hover:text-[#1D4ED8]">View all</Link>
                  </div>
                  <div className="max-h-[320px] overflow-auto divide-y divide-border">
                    {notifications.length === 0 && <p className="p-6 text-sm text-text-secondary text-center">No notifications</p>}
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          setShowBell(false);
                          if (
                            n.type === "verification_revoked" ||
                            n.link?.includes("verification_revoked") ||
                            (n.message?.toLowerCase().includes("revoked") && n.message?.toLowerCase().includes("verification"))
                          ) {
                            setSelectedRevocationNotif(n);
                            setShowRevocationModal(true);
                            return;
                          }
                          router.visit(n.link || "/notifications");
                        }}
                        className={`w-full min-h-[56px] text-left px-4 py-3 flex gap-3 hover:bg-bg active:bg-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action ${!n.read ? "bg-action/10" : ""}`}
                      >
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-bg" : "bg-action"}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary leading-snug">{n.message}</p>
                          <p className="text-xs text-text-secondary mt-1">{n.timestamp}{n.link ? <span> · Tap to view <ArrowRightIcon className="w-3 h-3 inline-block -mt-0.5" /></span> : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && <ProfileMenu />}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-11 h-11 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-surface/10 active:bg-surface/15 active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" aria-label="Menu" aria-expanded={mobileOpen} aria-controls="mobile-nav">
            {mobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sticky mobile search — hidden on messages, reels, and admin to save viewport height */}
      {!pathname.startsWith("/messages") && !pathname.startsWith("/reels") && !pathname.startsWith("/admin") && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar onSearch={(q) => router.visit(`/search?q=${encodeURIComponent(q)}`)} />
        </div>
      )}

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-white/10 bg-primary px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 max-h-[calc(100dvh-64px)] overflow-y-auto"
        >
          {user ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3">
              <img
                src={user.avatar || "https://i.pravatar.cc/100?img=12"}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0 aspect-square border border-white/20"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-300 truncate">{user.email}</p>
              </div>
            </div>
          ) : null}

          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            {!user && (
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  pathname === "/"
                    ? "bg-white/15 text-white font-semibold"
                    : "text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/10"
                }`}
              >
                Home
              </Link>
            )}
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                pathname === "/about"
                  ? "bg-white/15 text-white font-semibold"
                  : "text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/10"
              }`}
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                pathname === "/contact"
                  ? "bg-white/15 text-white font-semibold"
                  : "text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/10"
              }`}
            >
              Contact
            </Link>
            {user && hasRole(page, "Admin") && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                  pathname.startsWith("/admin")
                    ? "bg-white/15 text-white font-semibold"
                    : "text-slate-200 hover:text-white hover:bg-white/10 active:bg-white/10"
                }`}
              >
                <span>Admin Console</span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent text-[#0B1F3A]">
                  STAFF
                </span>
              </Link>
            )}
          </div>

          {/* User actions */}
          {user ? (
            <div className="pt-2 border-t border-white/10 space-y-2">
              {can(page, "opportunities.create") && (
                <Link
                  href="/create"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 min-h-[46px] w-full text-center bg-action hover:bg-action-hover active:scale-[0.99] text-white rounded-xl py-2.5 px-4 text-sm font-semibold shadow-sm transition-all"
                >
                  + Post Opportunity
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 active:bg-red-500/20 text-sm font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>
          ) : (
            /* Guest Auth Buttons: 2-column balanced grid with min-h-[46px] touch targets */
            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center min-h-[46px] px-4 py-2.5 rounded-xl border border-white/30 text-white font-medium text-sm hover:bg-white/10 active:bg-white/15 transition-colors text-center"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center min-h-[46px] px-4 py-2.5 rounded-xl bg-action hover:bg-action-hover active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all text-center"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Leaving so soon?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full sm:w-auto min-h-[44px] justify-center"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmLogout}
              className="w-full sm:w-auto min-h-[44px] justify-center bg-red-600 hover:bg-red-700 focus:ring-red-500 font-semibold text-white"
            >
              Yes, logout
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-2 px-1">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-[var(--color-border)] shadow-sm aspect-square shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-surface border border-border grid place-items-center mb-3 text-text-secondary">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          )}
          <h3 className="text-[var(--color-text-primary)] text-base font-bold">
            Are you sure you want to log out?
          </h3>
          <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mt-1.5 max-w-xs leading-relaxed">
            You will need to log in again to access your dashboard.
          </p>
        </div>
      </Modal>

      {showRevocationModal && (
        <VerificationRevokedModal
          isOpen={showRevocationModal}
          onClose={() => setShowRevocationModal(false)}
          notification={selectedRevocationNotif}
          user={user}
        />
      )}
    </header>
  );
}
