import { useState, useEffect } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowRightIcon } from "../components/icons";
import { httpApi } from "../utils/http";
import { useToast } from "../context/ToastContext";
import VerificationRevokedModal from "../components/VerificationRevokedModal";

export default function Notifications({ notifications: initial = [], unread: initialUnread = 0 }) {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const [notifications, setNotifications] = useState(initial || []);
  const [unread, setUnread] = useState(initialUnread || 0);
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [selectedRevocationNotif, setSelectedRevocationNotif] = useState(null);
  const toast = useToast();

  const isRevocationNotif = (n) =>
    n.type === "verification_revoked" ||
    n.link?.includes("verification_revoked") ||
    (n.message?.toLowerCase().includes("revoked") && n.message?.toLowerCase().includes("verification"));

  // Check URL param on mount (e.g. redirected with ?verification_revoked=1)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verification_revoked") === "1" || params.get("revocation") === "1") {
        const found = (notifications || []).find((n) => isRevocationNotif(n));
        setSelectedRevocationNotif(found || null);
        setShowRevocationModal(true);
      }
    }
  }, [notifications]);

  const onMarkRead = async (id) => {
    const target = notifications.find((n) => String(n.id) === String(id));
    try {
      await httpApi.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
      if (target && !target.read) setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      toast.error(err.message || "Mark read failed");
    }
  };

  const handleNotificationClick = (e, n) => {
    if (isRevocationNotif(n)) {
      e.preventDefault();
      onMarkRead(n.id);
      setSelectedRevocationNotif(n);
      setShowRevocationModal(true);
      return;
    }
    onMarkRead(n.id);
  };

  const onMarkAll = async () => {
    try {
      await httpApi.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      toast.error(err.message || "Mark all failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title={`Notifications${unread > 0 ? ` (${unread})` : ""}`} />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-text-primary">Notifications{unread > 0 ? ` (${unread})` : ""}</h1>
          <p className="text-sm text-text-secondary mt-1">The moment something happens, you'll know.</p>
        </div>
        {unread > 0 && <button onClick={onMarkAll} className="text-xs font-medium text-action hover:text-[#1D4ED8] border border-action/20 bg-action/10 rounded-full px-3 py-1.5">Mark all read</button>}
      </div>
      <div className="mt-6 bg-surface rounded-xl border border-border shadow-sm divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 && <p className="p-8 text-center text-sm text-text-secondary">No notifications</p>}
        {notifications.map((n) => {
          const isRevocation = isRevocationNotif(n);
          const body = (
            <>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-bg" : "bg-action"}`}></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{n.message}</p>
                <p className="text-xs text-text-secondary mt-1">{n.timestamp}{n.link || isRevocation ? <span> · Tap to view details <ArrowRightIcon className="w-3 h-3 inline-block -mt-0.5" /></span> : ""}</p>
              </div>
              {!n.read && <span className="text-xs font-medium text-action shrink-0">Mark read</span>}
            </>
          );
          return isRevocation ? (
            <button
              key={n.id}
              onClick={(e) => handleNotificationClick(e, n)}
              className={`w-full text-left p-4 flex gap-3 hover:bg-bg transition-colors cursor-pointer ${!n.read ? "bg-action/10" : ""}`}
            >
              {body}
            </button>
          ) : n.link ? (
            <Link
              key={n.id}
              href={n.link}
              onClick={(e) => handleNotificationClick(e, n)}
              className={`p-4 flex gap-3 hover:bg-bg transition-colors ${!n.read ? "bg-action/10" : ""}`}
            >
              {body}
            </Link>
          ) : (
            <button
              key={n.id}
              onClick={(e) => handleNotificationClick(e, n)}
              className={`w-full text-left p-4 flex gap-3 ${!n.read ? "bg-action/10" : ""}`}
            >
              {body}
            </button>
          );
        })}
      </div>
      {notifications.length > 0 && (
        <p className="text-center text-xs text-text-secondary mt-4">That's everything — no older notifications.</p>
      )}

      {showRevocationModal && (
        <VerificationRevokedModal
          isOpen={showRevocationModal}
          onClose={() => setShowRevocationModal(false)}
          notification={selectedRevocationNotif}
          user={user}
        />
      )}
    </div>
  );
}
