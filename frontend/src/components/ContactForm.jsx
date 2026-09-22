import { useState } from "react";

export default function ContactForm({ prefill, onClose, onSubmit, compact=false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(prefill ? `Hi — I'm interested in ${prefill.headline} (${prefill.brandName}). Please share details.` : "");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) { setError("Please fill in all fields."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }
    setSent(true);
    onSubmit && onSubmit({ name, email, message, source: prefill });
  };

  if (sent) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-center">
        <span className="w-12 h-12 rounded-full bg-green-50 text-[#16A34A] grid place-items-center mx-auto text-xl">✓</span>
        <h3 className="text-base font-semibold text-slate-900 mt-3">Message sent — (simulated)</h3>
        <p className="text-sm text-slate-500 mt-1">We’ve previewed this as an email-style toast. In production this would notify the brand and open a consultation thread.</p>
        {onClose && <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-sm font-medium">Close</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`bg-white rounded-xl border border-slate-100 shadow-sm ${compact ? "p-5" : "p-6 md:p-8"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{prefill ? `Inquire · ${prefill.brandName}` : "Contact BizLink"}</h3>
          <p className="text-sm text-slate-500 mt-1">{prefill ? `About: ${prefill.headline}` : "General inquiry — we’ll respond within 24h."}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 text-lg leading-none">×</button>}
      </div>

      {error && <p className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Dela Cruz" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="juan@email.com" className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Message</label>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={500} rows={4} placeholder="Tell us what you need..." className="mt-1 w-full border border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 resize-none" />
          <p className="text-xs text-slate-400 mt-1">{message.length}/500</p>
        </div>
        <button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2">Send Message</button>
      </div>
    </form>
  );
}
