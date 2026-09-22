import { useEffect, useState } from "react";
import { notificationsApi } from "../api/client";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data || []);
      setUnread(res.meta?.unread ?? res.data.filter((n) => !n.read).length);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      setError(err.message || "Mark read failed");
    }
  };

  const onMarkAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      setError(err.message || "Mark all failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#0B1F3A]">Notifications{unread > 0 ? ` (${unread})` : ""}</h1>
          <p className="text-sm text-slate-500 mt-1">Live from Laravel + MySQL.</p>
        </div>
        {unread > 0 && <button onClick={onMarkAll} className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] border border-blue-100 bg-blue-50 rounded-full px-3 py-1.5">Mark all read</button>}
      </div>
      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500 mt-6">Loading...</p>
      ) : (
        <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No notifications</p>}
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 flex gap-3 ${!n.read ? "bg-blue-50/50" : ""}`}>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-slate-200" : "bg-[#2563EB]"}`}></span>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{n.timestamp}</p>
              </div>
              {!n.read && <button onClick={() => onMarkRead(n.id)} className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] shrink-0">Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
