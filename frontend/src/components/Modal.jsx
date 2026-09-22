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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`bg-[var(--color-surface)] w-full ${maxWidth} rounded-2xl shadow-xl border border-[var(--color-border)] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-text-secondary hover:text-text-secondary rounded-full hover:bg-bg transition-colors"
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
          <div className="p-4 border-t border-[var(--color-border)] bg-bg dark:bg-slate-900/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
