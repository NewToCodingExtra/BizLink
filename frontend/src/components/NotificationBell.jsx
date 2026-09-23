export default function NotificationBell({ notifications = [], onToggle }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <button onClick={onToggle} aria-label="Notifications" className="relative w-9 h-9 grid place-items-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-error text-white text-[10px] font-bold leading-none ring-2 ring-[#0B1F3A] dark:ring-[#040814]">{unread > 99 ? "99+" : unread}</span>}
    </button>
  );
}
