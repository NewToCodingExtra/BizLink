import { Link } from "react-router-dom";

export default function Notifications({ notifications, onMarkRead }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Notifications</h1>
      <p className="text-sm text-slate-500 mt-1">Simulated — in-app email-style previews.</p>
      <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {notifications.length===0 && <p className="p-8 text-center text-sm text-slate-400">No notifications</p>}
        {notifications.map(n => (
          <div key={n.id} className={`p-4 flex gap-3 ${!n.read ? "bg-blue-50/50" : ""}`}>
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-slate-200" : "bg-[#2563EB]"}`}></span>
            <div className="flex-1">
              <p className="text-sm text-slate-700">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">{n.timestamp}</p>
            </div>
            {!n.read && <button onClick={()=>onMarkRead(n.id)} className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] shrink-0">Mark read</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
