import { Link } from "react-router-dom";

export default function MessagesInbox({ conversations }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Consultation Inbox</h1>
      <p className="text-sm text-slate-500 mt-1">Private buyer ↔ seller threads. Separate from public comments.</p>
      <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {conversations.length===0 && <p className="p-8 text-center text-sm text-slate-400">No conversations yet — tap Inquire on any card.</p>}
        {conversations.map(c => (
          <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
            <img src={c.avatar} alt={c.with} className="w-10 h-10 rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{c.with}</span>
                {c.unread>0 && <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>}
              </div>
              <p className="text-sm text-slate-500 truncate">{c.lastMessage}</p>
            </div>
            <span className="text-xs text-slate-400">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
