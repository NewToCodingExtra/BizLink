import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";

export default function Navbar({ notifications, onMarkRead }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-150 ${location.pathname === path ? "text-white" : "text-slate-300 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F3A] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[64px] flex items-center gap-4">
        {/* Logo - Business Name every page */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-[#C9A24B] flex items-center justify-center text-[#0B1F3A] font-extrabold text-sm">B</span>
          <span className="text-white font-bold tracking-tight text-[18px]">BuseLink</span>
          <span className="hidden sm:inline text-[10px] tracking-[0.18em] text-[#C9A24B] font-semibold ml-1">BRIDGING BRANDS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-6">
          <Link to="/" className={linkClass("/")}>Feed</Link>
          <Link to="/about" className={linkClass("/about")}>About</Link>
          <Link to="/reels" className={linkClass("/reels")}>Reels</Link>
          <Link to="/messages" className={linkClass("/messages")}>Messages</Link>
          <Link to="/saved" className={linkClass("/saved")}>Saved</Link>
        </nav>

        {/* Search – desktop */}
        <div className="hidden md:block flex-1 max-w-[360px] ml-auto">
          <SearchBar onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <Link to="/create" className="hidden sm:inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
            <span className="text-lg leading-none -mt-0.5">+</span> Post
          </Link>

          <div className="relative">
            <NotificationBell notifications={notifications} onToggle={() => setShowBell(!showBell)} onMarkRead={onMarkRead} />
            {showBell && (
              <div className="absolute right-0 mt-3 w-[340px] bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden z-50">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <Link to="/notifications" onClick={() => setShowBell(false)} className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8]">View all</Link>
                </div>
                <div className="max-h-[320px] overflow-auto divide-y divide-slate-50">
                  {notifications.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">No notifications</p>}
                  {notifications.slice(0,5).map(n => (
                    <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? "bg-blue-50/60" : ""}`}>
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-slate-200" : "bg-[#2563EB]"}`}></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{n.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/profile/brand-1" className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
            <img src="https://i.pravatar.cc/100?img=12" alt="profile" className="w-full h-full object-cover" />
          </Link>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
            <span className="text-xl leading-none">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B1F3A] px-4 py-4 space-y-3">
          <SearchBar onSearch={(q) => { setMobileOpen(false); navigate(`/search?q=${encodeURIComponent(q)}`); }} />
          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/" onClick={()=>setMobileOpen(false)} className="px-3 py-1.5 rounded-full bg-white text-[#0B1F3A] text-sm font-medium">Feed</Link>
            <Link to="/about" onClick={()=>setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">About</Link>
            <Link to="/reels" onClick={()=>setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Reels</Link>
            <Link to="/messages" onClick={()=>setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Messages</Link>
            <Link to="/contact" onClick={()=>setMobileOpen(false)} className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm">Contact</Link>
          </div>
          <Link to="/create" onClick={()=>setMobileOpen(false)} className="block text-center bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-medium">+ Post Opportunity</Link>
        </div>
      )}
    </header>
  );
}
