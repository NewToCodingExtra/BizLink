import { useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import Navbar from "../Components/Navbar";
import BottomNav from "../Components/BottomNav";
import Footer from "../Components/Footer";
import GlobalModals from "../Components/GlobalModals";
import { useToast } from "../context/ToastContext";

export default function AppLayout({ children }) {
  const page = usePage();
  const { flash } = page.props;
  const toast = useToast();
  // Full-bleed reels: no footer under the snap feed (it read as stray whitespace).
  const pathname = page.url.split("?")[0];
  const hideFooter = pathname.startsWith("/reels");
  // Toast-once guard: flash props persist across client-side visits and the
  // toast object is referentially unstable, so neither seen-state nor the
  // effect deps alone prevent repeats. Ref records the last toasted key.
  const lastToasted = useRef(null);
  const toastRef = useRef(null);

  // Server flash messages (redirects) surface as toasts, once each.
  useEffect(() => {
    toastRef.current = toast;
    const key = `${flash?.success || ""}|${flash?.error || ""}`;
    if (!key || key === "|" || lastToasted.current === key) return;
    lastToasted.current = key;
    if (flash?.success) toastRef.current.success(flash.success);
    if (flash?.error) toastRef.current.error(flash.error);
  }, [toast, flash]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-surface focus:text-text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:border focus:border-border"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 min-w-0 pb-24 md:pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
      {!hideFooter && <Footer />}
      <GlobalModals />
    </div>
  );
}
