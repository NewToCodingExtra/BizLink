import { useState } from "react";
import ContactForm from "../components/ContactForm";
import { contactApi } from "../api/client";

export default function Contact() {
  const [status, setStatus] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#0B1F3A]">Contact / Contact Information</h1>
      <p className="text-sm text-slate-500 mt-1">Messages are stored via Laravel and logged on the backend.</p>

      {status && <p className="mt-4 text-sm text-[#16A34A] bg-green-50 border border-green-100 rounded-lg px-3 py-2">{status}</p>}

      <div className="mt-6 grid gap-6">
        <div className="bg-[#0B1F3A] rounded-xl p-6 text-white">
          <h3 className="text-base font-semibold">BuseLink HQ</h3>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">15F One World Place, BGC, Taguig · hello@buselink.ph · +63 917 000 0000<br />Mon–Fri 9AM–6PM PHT</p>
          <div className="mt-4 flex gap-2">
            <span className="text-xs bg-white/10 rounded-full px-3 py-1">hello@buselink.ph</span>
            <span className="text-xs bg-[#C9A24B] text-[#0B1F3A] font-semibold rounded-full px-3 py-1">Verified Support</span>
          </div>
        </div>
        <ContactForm
          onSubmit={async ({ name, email, message }) => {
            await contactApi.submit({ name, email, message });
            setStatus("Message received. We will reply shortly.");
          }}
        />
      </div>
    </div>
  );
}
