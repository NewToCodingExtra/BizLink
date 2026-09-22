import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import markUrl from "../assets/bizlink-mark.svg";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../api/client";

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

  const handleLogout = async () => {
    await logout();
    setShowBell(false);
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-150 ${location.pathname === path ? "text-white" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F3A] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-4">
        <Link to={user ? "/feed" : "/"} className="flex items-center gap-2 shrink-0">
          <img src={markUrl} alt="BizLink" className="w-8 h-8 rounded-lg" />
          <span className="font-bold tracking-tight text-[18px]"><span className="text-white">Biz</span><span className="text-[#C9A24B]">Link</span></span>
          <span className="hidden sm:inline text-[10px] tracking-[0.18em] text-[#C9A24B] font-semibold ml-1">BRIDGING BRANDS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-6">
          <Link to={user ? "/feed" : "/"} className={linkClass(user ? "/feed" : "/")}>{user ? "Feed" : "Home"}</Link>
          <Link to="/about" className={linkClass("/about")}>About</Link>
          <Link to="/reels" className={linkClass("/reels")}>Reels</Link>
          {user && <Link to="/messages" className={linkClass("/messages")}>Messages</Link>}
          {user && <Link to="/saved" className={linkClass("/saved")}>Saved</Link>}
        </nav>

        <div className="hidden md:block flex-1 max-w-[360px] ml-auto">
          <SearchBar onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {user ? (
            <Link to="/create" className="hidden sm:inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
              <span className="text-lg leading-none -mt-0.5">+</span> Post
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-200 hover:text-white px-3 py-2">Log in</Link>
              <Link to="/register" className="hidden sm:inline-flex items-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Sign up</Link>
            </>
          )}

          {user && (
            <div className="relative">
              <NotificationBell notifications={notifications} onToggle={() => setShowBell(!showBell)} />
              {showBell && (
                <div className="absolute right-0 mt-3 w-[340px] bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Notifications{unread > 0 ? ` (${unread})` : ""}</p>
                    <Link to="/notifications" onClick={() => setShowBell(false)} className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8]">View all</Link>
                  </div>
                  <div className="max-h-[320px] overflow-auto divide-y divide-slate-50">
                    {notifications.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No notifications</p>}
                    {notifications.slice(0, 5).map((n) => (
                      <button key={n.id} onClick={() => markRead(n.id)} className={`w-full text-left px-4 py-3 flex gap-3 ${!n.read ? "bg-blue-50/60" : ""}`}>
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-slate-200" : "bg-[#2563EB]"}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.timestamp}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile/me" className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0" title={user.name}>
                <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="profile" className="w-full h-full object-cover" />
              </Link>
              <button onClick={handleLogout} className="hidden sm:inline text-xs font-medium text-slate-300 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-colors">Logout</button>
            </div>
          ) : null}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
            <span className="text-xl leading-none">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B1F3A] px-4 py-4 space-y-3">
          <SearchBar onSearch={(q) => { setMobileOpen(false); navigate(`/search?q=${encodeURIComponent(q)}`); }} />
          <div className="flex flex-wrap gap-2 pt-2">
            <Link to={user ? "/feed" : "/"} onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-white text-[#0B1F3A] text-sm font-medium">{user ? "Feed" : "Home"}</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">About</Link>
            <Link to="/reels" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Reels</Link>
            {user && <Link to="/messages" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Messages</Link>}
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Contact</Link>
            {!user && <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Log in</Link>}
            {!user && <Link to="/register" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-[#2563EB] text-white text-sm">Sign up</Link>}
          </div>
          {user ? (
            <>
              <Link to="/create" onClick={() => setMobileOpen(false)} className="block text-center bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-medium">+ Post Opportunity</Link>
              <button onClick={handleLogout} className="block w-full text-center border border-white/20 text-white rounded-lg py-2.5 text-sm">Logout ({user.name})</button>
            </>
          ) : null}
        </div>
      )}
    </header>
  );
}
