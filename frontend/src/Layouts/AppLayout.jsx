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
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-surface focus:text-text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-border"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 min-w-0 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</main>
      <Footer />
      <GlobalModals />
    </div>
  );
}
