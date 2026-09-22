import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import SmartLink from "./SmartLink";
import ProfileMenu from "./ProfileMenu";
import markUrl from "../assets/bizlink-mark.svg";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../api/client";
import Modal from "./Modal";
import Button from "./Button";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    notificationsApi
      .list()
      .then((res) => setNotifications(res.data || []))
      .catch(() => setNotifications([]));
  }, [user, location.pathname]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
    } catch {
      // keep local state unchanged on failure
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    await logout();
    setShowBell(false);
    setMobileOpen(false);
    setShowLogoutConfirm(false);
    navigate("/", { replace: true });
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-150 ${location.pathname === path ? "text-white" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 bg-primary border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-4">
        <SmartLink to={user ? "/feed" : "/"} className="flex items-center gap-2 shrink-0">
          <img src={markUrl} alt="BizLink" className="w-8 h-8 rounded-lg" />
          <span className="font-bold tracking-tight text-[18px]"><span className="text-white">Biz</span><span className="text-accent">Link</span></span>
          <span className="hidden sm:inline text-[10px] tracking-[0.18em] text-accent font-semibold ml-1">BRIDGING BRANDS</span>
        </SmartLink>

        <nav className="hidden md:flex items-center gap-6 ml-6">
          <SmartLink to={user ? "/feed" : "/"} className={linkClass(user ? "/feed" : "/")}>{user ? "Feed" : "Home"}</SmartLink>
          <SmartLink to="/about" className={linkClass("/about")}>About</SmartLink>
          <SmartLink to="/reels" className={linkClass("/reels")}>Reels</SmartLink>
          {user && <SmartLink to="/messages" className={linkClass("/messages")}>Messages</SmartLink>}
          {user && <SmartLink to="/saved" className={linkClass("/saved")}>Saved</SmartLink>}
        </nav>

        <div className="hidden md:block flex-1 max-w-[360px] ml-auto">
          <SearchBar onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {user ? (
            <SmartLink to="/create" className="hidden sm:inline-flex items-center gap-1.5 bg-action hover:bg-action-hover active:bg-[#1E40AF] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
              <span className="text-lg leading-none -mt-0.5">+</span> Post
            </SmartLink>
          ) : (
            <>
              <SmartLink to="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-200 hover:text-white px-3 py-2">Log in</SmartLink>
              <SmartLink to="/register" className="hidden sm:inline-flex items-center bg-action hover:bg-action-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Sign up</SmartLink>
            </>
          )}

          {user && (
            <div className="relative">
              <NotificationBell notifications={notifications} onToggle={() => setShowBell(!showBell)} />
              {showBell && (
                <div className="absolute right-0 mt-3 w-[340px] bg-surface rounded-xl shadow-md border border-border overflow-hidden z-50">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <p className="text-sm font-semibold text-text-primary">Notifications{unread > 0 ? ` (${unread})` : ""}</p>
                    <SmartLink to="/notifications" onClick={() => setShowBell(false)} className="text-xs font-medium text-action hover:text-[#1D4ED8]">View all</SmartLink>
                  </div>
                  <div className="max-h-[320px] overflow-auto divide-y divide-slate-50">
                    {notifications.length === 0 && <p className="p-6 text-sm text-text-secondary text-center">No notifications</p>}
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          setShowBell(false);
                          if (n.link) navigate(n.link);
                          else navigate("/notifications");
                        }}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-bg transition-colors ${!n.read ? "bg-blue-50/60" : ""}`}
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
          <SearchBar onSearch={(q) => { setMobileOpen(false); navigate(`/search?q=${encodeURIComponent(q)}`); }} />
          {user && (
            <div className="flex items-center gap-3 rounded-xl bg-surface/5 border border-white/10 px-3 py-2.5">
              <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-text-secondary truncate">{user.email}</p>
              </div>
              <SmartLink to="/profile/edit" onClick={() => setMobileOpen(false)} className="text-xs font-medium text-accent hover:text-white shrink-0">Edit</SmartLink>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <SmartLink to={user ? "/feed" : "/"} onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-surface text-primary text-sm font-medium">{user ? "Feed" : "Home"}</SmartLink>
            <SmartLink to="/about" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">About</SmartLink>
            <SmartLink to="/reels" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Reels</SmartLink>
            {user && <SmartLink to="/messages" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Messages</SmartLink>}
            <SmartLink to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Contact</SmartLink>
            {!user && <SmartLink to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Log in</SmartLink>}
            {!user && <SmartLink to="/register" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-action text-white text-sm">Sign up</SmartLink>}
          </div>
          {user ? (
            <>
              <SmartLink to="/create" onClick={() => setMobileOpen(false)} className="block text-center bg-action text-white rounded-lg py-2.5 text-sm font-medium">+ Post Opportunity</SmartLink>
              <div className="grid grid-cols-2 gap-2">
                <SmartLink to="/profile/me" onClick={() => setMobileOpen(false)} className="block text-center border border-white/20 text-white rounded-lg py-2.5 text-sm">Profile</SmartLink>
                <button onClick={handleLogout} className="block w-full text-center bg-red-500/15 border border-red-400/30 text-red-200 rounded-lg py-2.5 text-sm font-medium">Logout</button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log out"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Log out</Button>
          </>
        }
      >
        <p className="text-text-primary">Are you sure you want to log out?</p>
      </Modal>
    </header>
  );
}
