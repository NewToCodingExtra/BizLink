import React, { useEffect, useRef } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  closeOnClickOutside = true
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pb-[max(0rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        className={`bg-[var(--color-surface)] w-full ${maxWidth} rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-[var(--color-border)] flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200`}
      >
        {/* Mobile Grab / Pull Handle Indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-[var(--color-border)]">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] truncate">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 min-w-[36px] min-h-[36px] grid place-items-center text-text-secondary hover:text-text-primary rounded-full hover:bg-bg active:bg-bg active:scale-[0.97] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--color-border)] bg-bg dark:bg-bg/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
