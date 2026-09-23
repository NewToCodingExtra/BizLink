import React, { createContext, useContext, useState, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: { error: (m) => addToast(m, 'error'), success: (m) => addToast(m, 'success'), info: (m, d) => addToast(m, 'info', d ?? 6000) } }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { error: () => {}, success: () => {} };
  return ctx.toast;
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const circleRadius = 14;
  const circumference = 2 * Math.PI * circleRadius;
  
  // Format message just in case an object/array is passed.
  // React nodes (e.g. messages with links) render directly.
  const displayMessage = typeof toast.message === 'string' || React.isValidElement(toast.message)
    ? toast.message
    : (toast.message?.message || JSON.stringify(toast.message));

  return (
    <div className="pointer-events-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 flex items-center gap-3 shadow-2xl animate-toast-slide-up relative overflow-hidden backdrop-blur-md">
      {/* Type indicator strip */}
      {toast.type === 'error' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error/80" />}
      {toast.type === 'success' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-success/80" />}
      {toast.type === 'info' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-action/80" />}
      
      <p className="flex-1 text-sm font-medium text-[var(--color-text-primary)] pl-2">
        {displayMessage}
      </p>

      {/* Close button with circular progress */}
      <button 
        onClick={() => onRemove(toast.id)} 
        className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors group"
      >
        <svg className="w-4 h-4 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        <svg className="absolute inset-0 w-full h-full -rotate-90 z-0" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={circleRadius} fill="transparent" stroke="var(--color-border)" strokeWidth="2" className="opacity-50" />
          <circle 
            cx="18" cy="18" r={circleRadius} 
            fill="transparent" 
            stroke="var(--color-action)" 
            strokeWidth="2.5" 
            strokeDasharray={circumference} 
            strokeDashoffset={circumference}
            strokeLinecap="round" 
            style={{ animation: `toast-progress ${toast.duration}ms linear forwards` }}
          />
        </svg>
      </button>
    </div>
  );
}
