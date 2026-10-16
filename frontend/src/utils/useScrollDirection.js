import { useEffect, useState } from "react";

/**
 * Detects vertical scroll direction for mobile auto-hiding navigation.
 * Returns isHidden = true when scrolling down past threshold, false when scrolling up or near top.
 */
export function useScrollDirection({ threshold = 12 } = {}) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always show navbars when near top of the page
          if (currentScrollY <= 40) {
            setIsHidden(false);
            lastScrollY = Math.max(0, currentScrollY);
            ticking = false;
            return;
          }

          const diff = currentScrollY - lastScrollY;

          // Only trigger if scroll delta exceeds threshold
          if (Math.abs(diff) >= threshold) {
            if (diff > 0) {
              // Scrolling down -> hide navbars on mobile
              setIsHidden(true);
            } else {
              // Scrolling up -> show navbars
              setIsHidden(false);
            }
            lastScrollY = Math.max(0, currentScrollY);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return isHidden;
}
