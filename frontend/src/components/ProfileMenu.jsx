import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function ProfileMenu({ onAction }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  if (!user) return null;

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
      setOpen(false);
      if (onAction) onAction();
      navigate("/", { replace: true });
    }
  };

  const itemClass =
    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.name}
        className={`flex items-center gap-1 rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${open ? "border-[#C9A24B]" : "border-white/20 hover:border-white/50"}`}
      >
        <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="profile" className="w-7 h-7 rounded-full object-cover" />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`mr-0.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 mt-2 w-64 bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-xl overflow-hidden z-50 origin-top-right">
            <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="py-1.5">
              <Link
                to="/profile/me"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (onAction) onAction();
                }}
                className={itemClass}
              >
                <span className="text-slate-400"><UserIcon /></span> Profile
              </Link>
              <Link
                to="/profile/edit"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (onAction) onAction();
                }}
                className={itemClass}
              >
                <span className="text-slate-400"><PencilIcon /></span> Edit profile
              </Link>
            </div>
            <div className="border-t border-slate-100 py-1.5">
              <button role="menuitem" onClick={handleLogout} disabled={busy} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#DC2626] hover:bg-red-50 disabled:opacity-60 transition-colors text-left">
                <span><LogoutIcon /></span> {busy ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
