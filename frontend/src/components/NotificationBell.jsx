export default function NotificationBell({ notifications = [], onToggle }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <button onClick={onToggle} className="relative w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-300">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 9a6 6 0 0 1 12 0c0 7-6 11-6 11S6 16 6 9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">{unread}</span>}
    </button>
  );
}
