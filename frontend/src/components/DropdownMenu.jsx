import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_Z = 100;
const GAP = 6;

/**
 * Overlay-safe dropdown menu.
 *
 * Renders into document.body via portal with fixed positioning, so it can
 * never be clipped by an ancestor's overflow-hidden (cards, reels, comment
 * lists) or painted under following siblings. Auto-flips above the trigger
 * when there is no room below, and clamps horizontally to the viewport.
 */
export default function DropdownMenu({
  open,
  onClose,
  triggerRef,
  children,
  align = "right",
  width = 192,
  preferAbove = false,
}) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  const place = () => {
    const el = triggerRef?.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuH = menuRef.current?.offsetHeight ?? 220;

    const openAbove = preferAbove || r.bottom + GAP + menuH > vh;
    const top = openAbove ? Math.max(8, r.top - GAP - menuH) : r.bottom + GAP;

    let left;
    if (align === "right") left = r.right - width;
    else if (align === "left") left = r.left;
    else left = r.left + r.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, vw - width - 8));

    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Re-measure after content paints (fonts/images shift height).
    const t = requestAnimationFrame(place);
    const onDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        triggerRef?.current?.contains(e.target)
      ) return;
      onClose?.();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    const onScroll = () => onClose?.();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width,
        zIndex: MENU_Z,
        visibility: pos ? "visible" : "hidden",
      }}
      className="bg-surface rounded-lg shadow-xl border border-border py-1 text-sm animate-in fade-in zoom-in-95 duration-100"
    >
      {children}
    </div>,
    document.body
  );
}
