import { useEffect, useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";
import Button from "./Button";

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

function SavedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

export default function ProfileMenu({ onAction }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const { isDark, setIsDark } = useTheme();
  const url = usePage().url;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [url]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  if (!user) return null;

  const handleConfirmLogout = () => {
    setBusy(true);
    router.post("/logout", {}, {
      onFinish: () => {
        setBusy(false);
        setShowLogoutConfirm(false);
        setOpen(false);
        if (onAction) onAction();
      },
    });
  };

  const itemClass =
    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left";

  return (
    <>
      <div ref={rootRef} className="relative shrink-0">
        <button
          onClick={() => setOpen(!open)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={user.name}
          className={`flex items-center gap-1 rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${open ? "border-accent" : "border-white/20 hover:border-white/50"}`}
        >
          <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="profile" className="w-7 h-7 rounded-full object-cover" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`mr-0.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-hidden="true" />
            <div role="menu" className="absolute right-0 mt-2 w-64 bg-[var(--color-surface)] rounded-2xl ring-1 ring-slate-900/5 shadow-xl overflow-hidden z-50 origin-top-right border border-[var(--color-border)]">
              <div className="px-4 py-3.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex items-center gap-3">
                <img src={user.avatar || "https://i.pravatar.cc/100?img=12"} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                </div>
              </div>
              <div className="py-1.5">
                <Link
                  href="/profile/me"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (onAction) onAction();
                  }}
                  className={itemClass}
                >
                  <span className="text-[var(--color-text-secondary)]"><UserIcon /></span> Profile
                </Link>
                <Link
                  href="/profile/edit"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (onAction) onAction();
                  }}
                  className={itemClass}
                >
                  <span className="text-[var(--color-text-secondary)]"><PencilIcon /></span> Edit profile
                </Link>
                <Link
                  href="/saved"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (onAction) onAction();
                  }}
                  className={itemClass}
                >
                  <span className="text-[var(--color-text-secondary)]"><SavedIcon /></span> Saved
                </Link>
              </div>
              <div className="border-t border-[var(--color-border)] py-1.5">
                <button
                  role="menuitem"
                  onClick={() => setIsDark(!isDark)}
                  className={itemClass}
                >
                  <span className="text-[var(--color-text-secondary)]">
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="4.22" x2="19.78" y2="5.64" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    )}
                  </span>
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
              <div className="border-t border-[var(--color-border)] py-1.5">
                <button role="menuitem" onClick={() => setShowLogoutConfirm(true)} disabled={busy} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-error hover:bg-red-50/10 disabled:opacity-60 transition-colors text-left">
                  <span><LogoutIcon /></span> {busy ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Leaving so soon?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} disabled={busy}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmLogout} disabled={busy}>
              {busy ? "Logging out..." : "Yes, logout"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center pb-2">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-[var(--color-border)]" />
          ) : (
            <svg className="w-20 h-20 text-[var(--color-text-secondary)] mb-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          )}
          <p className="text-[var(--color-text-primary)] text-base font-medium">
            Are you sure you want to log out?
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">
            You will need to log in again to access your dashboard.
          </p>
        </div>
      </Modal>
    </>
  );
}
