import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { httpApi } from "../utils/http";

export default function Notifications({ notifications: initial = [], unread: initialUnread = 0 }) {
  const [notifications, setNotifications] = useState(initial || []);
  const [unread, setUnread] = useState(initialUnread || 0);
  const [error, setError] = useState("");

  const onMarkRead = async (id) => {
    const target = notifications.find((n) => String(n.id) === String(id));
    try {
      await httpApi.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
      if (target && !target.read) setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      setError(err.message || "Mark read failed");
    }
  };

  const onMarkAll = async () => {
    try {
      await httpApi.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      setError(err.message || "Mark all failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title={`Notifications${unread > 0 ? ` (${unread})` : ""}`} />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-primary">Notifications{unread > 0 ? ` (${unread})` : ""}</h1>
          <p className="text-sm text-text-secondary mt-1">Live from Laravel + MySQL.</p>
        </div>
        {unread > 0 && <button onClick={onMarkAll} className="text-xs font-medium text-action hover:text-[#1D4ED8] border border-action/20 bg-action/10 rounded-full px-3 py-1.5">Mark all read</button>}
      </div>
      {error && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="mt-6 bg-surface rounded-xl border border-border shadow-sm divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 && <p className="p-8 text-center text-sm text-text-secondary">No notifications</p>}
        {notifications.map((n) => {
          const body = (
            <>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-bg" : "bg-action"}`}></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{n.message}</p>
                <p className="text-xs text-text-secondary mt-1">{n.timestamp}{n.link ? " · Tap to view →" : ""}</p>
              </div>
              {!n.read && <span className="text-xs font-medium text-action shrink-0">Mark read</span>}
            </>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} onClick={() => onMarkRead(n.id)} className={`p-4 flex gap-3 hover:bg-bg transition-colors ${!n.read ? "bg-action/10" : ""}`}>
              {body}
            </Link>
          ) : (
            <button key={n.id} onClick={() => onMarkRead(n.id)} className={`w-full text-left p-4 flex gap-3 ${!n.read ? "bg-action/10" : ""}`}>
              {body}
            </button>
          );
        })}
      </div>
      {notifications.length > 0 && (
        <p className="text-center text-xs text-text-secondary mt-4">That's everything — no older notifications.</p>
      )}
    </div>
  );
}
