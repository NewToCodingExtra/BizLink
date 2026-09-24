/**
 * Shared line-icon set (feather-style strokes, currentColor).
 * Used for like / comment / save / volume buttons — never emoji glyphs,
 * which render inconsistently across platforms and cheapen the UI.
 */

function Svg({ children, className = "w-4 h-4", filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HeartIcon({ filled = false, className = "w-4 h-4" }) {
  return (
    <Svg filled={filled} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

export function CommentIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

export function BookmarkIcon({ filled = false, className = "w-4 h-4" }) {
  return (
    <Svg filled={filled} className={className}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function VolumeOnIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Svg>
  );
}

export function VolumeOffIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </Svg>
  );
}

export function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function SparkleIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9L12 3z" />
    </svg>
  );
}

export function XIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function MenuIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function ArrowLeftIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function ArrowRightIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </Svg>
  );
}

export function ChevronRightIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function CopyrightIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.7A4.3 4.3 0 1 0 15.5 15.3" />
    </Svg>
  );
}

export function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Svg>
  );
}

export function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Svg>
  );
}

export function LinkedinIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </Svg>
  );
}

export function DotsIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </Svg>
  );
}

export function PencilIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Svg>
  );
}

export function TrashIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

export function FlagIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </Svg>
  );
}

export function LinkIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </Svg>
  );
}

export function ReplyIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <path d="M9 17l-5-5 5-5" />
      <path d="M4 12h9a7 7 0 0 1 7 7v1" />
    </Svg>
  );
}

export function ImageIcon({ className = "w-4 h-4" }) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}
