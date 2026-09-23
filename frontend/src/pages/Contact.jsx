import { useState } from "react";
import { Head } from "@inertiajs/react";
import ContactForm from "../Components/ContactForm";
import { httpApi } from "../utils/http";

export default function Contact() {
  const [status, setStatus] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Head title="Contact" />
      <h1 className="text-2xl font-semibold text-text-primary">Contact / Contact Information</h1>
      <p className="text-sm text-text-secondary mt-1">Messages are stored via Laravel and logged on the backend.</p>

      {status && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{status}</p>}

      <div className="mt-6 grid gap-6">
        <div className="bg-primary rounded-xl p-6 text-white">
          <h3 className="text-base font-semibold">BizLink HQ</h3>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">15F One World Place, BGC, Taguig · hello@bizlink.ph · +63 917 000 0000<br />Mon–Fri 9AM–6PM PHT</p>
          <div className="mt-4 flex gap-2">
            <span className="text-xs bg-surface/10 rounded-full px-3 py-1">hello@bizlink.ph</span>
            <span className="text-xs bg-accent text-primary font-semibold rounded-full px-3 py-1">Verified Support</span>
          </div>
        </div>
        <ContactForm
          onSubmit={async ({ name, email, message }) => {
            await httpApi.post("/contact", { name, email, message });
            setStatus("Message received. We will reply shortly.");
          }}
        />
      </div>
    </div>
  );
}
