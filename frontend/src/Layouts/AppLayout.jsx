import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import GlobalModals from "../Components/GlobalModals";
import { useToast } from "../context/ToastContext";

export default function AppLayout({ children }) {
  const { flash } = usePage().props;
  const toast = useToast();
  const [seenFlash, setSeenFlash] = useState(null);

  // Server flash messages (redirects) surface as toasts, once each.
  useEffect(() => {
    const key = `${flash?.success || ""}|${flash?.error || ""}`;
    if (!key || key === "|" || seenFlash === key) return;
    setSeenFlash(key);
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash, seenFlash, toast]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <GlobalModals />
    </div>
  );
}
