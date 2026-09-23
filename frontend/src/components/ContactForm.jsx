import { useState } from "react";
import { CheckIcon, XIcon } from "./icons";

export default function ContactForm({ prefill, onClose, onSubmit, compact=false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(prefill ? `Hi — I'm interested in ${prefill.headline} (${prefill.brandName}). Please share details.` : "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleBlur = (e) => {
    const field = e.target.name;
    if (!e.target.checkValidity()) {
      setFieldErrors((prev) => ({ ...prev, [field]: e.target.validationMessage }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getInputClass = (field) => {
    const base = "mt-1 w-full border outline-none rounded-lg px-3 py-2.5 text-sm placeholder:text-text-secondary transition-colors";
    return fieldErrors[field]
      ? `${base} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5`
      : `${base} border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-transparent`;
  };

  const submit = (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = {};

    if (!name.trim()) { newErrors.name = "Name is required."; hasError = true; }
    if (!email.trim()) { newErrors.email = "Email is required."; hasError = true; }
    else if (!/\S+@\S+\.\S+/.test(email)) { newErrors.email = "Enter a valid email address."; hasError = true; }
    if (!message.trim()) { newErrors.message = "Message is required."; hasError = true; }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }
    setSent(true);
    onSubmit && onSubmit({ name, email, message, source: prefill });
  };

  if (sent) {
    return (
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 text-center">
        <span className="w-12 h-12 rounded-full bg-success/10 text-success grid place-items-center mx-auto"><CheckIcon className="w-6 h-6" /></span>
        <h3 className="text-base font-semibold text-text-primary mt-3">Message sent — (simulated)</h3>
        <p className="text-sm text-text-secondary mt-1">We’ve previewed this as an email-style toast. In production this would notify the brand and open a consultation thread.</p>
        {onClose && <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Close</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "p-1" : "bg-surface rounded-xl border border-border shadow-sm p-6 md:p-8"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{prefill ? `Inquire · ${prefill.brandName}` : "Contact BizLink"}</h3>
          <p className="text-sm text-text-secondary mt-1">{prefill ? `About: ${prefill.headline}` : "General inquiry — we’ll respond within 24h."}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full border border-border text-text-secondary hover:bg-bg"><XIcon /></button>}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary">Name</label>
          <input name="name" value={name} onChange={e=>setName(e.target.value)} onBlur={handleBlur} required placeholder="Juan Dela Cruz" className={getInputClass('name')} />
          {fieldErrors.name && <p className="mt-1 text-xs text-error">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary">Email</label>
          <input name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} onBlur={handleBlur} required placeholder="juan@email.com" className={getInputClass('email')} />
          {fieldErrors.email && <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary">Message</label>
          <textarea name="message" value={message} onChange={e=>setMessage(e.target.value)} onBlur={handleBlur} required maxLength={500} rows={4} placeholder="Tell us what you need..." className={`${getInputClass('message')} resize-none`} />
          {fieldErrors.message ? <p className="mt-1 text-xs text-error">{fieldErrors.message}</p> : <p className="text-xs text-text-secondary mt-1">{message.length}/500</p>}
        </div>
        <button type="submit" className="w-full bg-action hover:bg-action-hover active:bg-[#1E40AF] disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2">Send Message</button>
      </div>
    </form>
  );
}
