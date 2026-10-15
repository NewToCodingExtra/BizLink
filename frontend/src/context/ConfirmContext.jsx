import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const resolveRef = useRef(null);
  const inputRef = useRef(null);
  const confirmBtnRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;

      let config = {
        type: "confirm",
        title: "Confirm Action",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "primary", // 'danger' | 'warning' | 'primary'
      };

      if (typeof options === "string") {
        config.message = options;
        const lower = options.toLowerCase();
        if (
          lower.includes("delete") ||
          lower.includes("remove") ||
          lower.includes("revoke") ||
          lower.includes("cancel") ||
          lower.includes("end")
        ) {
          config.variant = "danger";
          if (lower.includes("delete")) config.confirmText = "Delete";
          else if (lower.includes("revoke")) config.confirmText = "Revoke";
          else if (lower.includes("end")) config.confirmText = "End Meeting";
        }
      } else if (options && typeof options === "object") {
        config = { ...config, ...options };
      }

      setDialogState(config);
    });
  }, []);

  const prompt = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;

      let config = {
        type: "prompt",
        title: "Input Required",
        message: "",
        placeholder: "",
        defaultValue: "",
        inputValue: typeof options === "object" ? (options.defaultValue || "") : "",
        confirmText: "Submit",
        cancelText: "Cancel",
        variant: "primary",
      };

      if (typeof options === "string") {
        config.message = options;
      } else if (options && typeof options === "object") {
        config = { ...config, ...options, inputValue: options.defaultValue || "" };
      }

      setDialogState(config);
    });
  }, []);

  const handleClose = useCallback((value) => {
    if (resolveRef.current) {
      resolveRef.current(value);
      resolveRef.current = null;
    }
    setDialogState(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!dialogState) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(dialogState.type === "prompt" ? null : false);
      } else if (e.key === "Enter" && dialogState.type === "confirm") {
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogState, handleClose]);

  // Auto-focus
  useEffect(() => {
    if (!dialogState) return;
    const timer = setTimeout(() => {
      if (dialogState.type === "prompt" && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      } else if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [dialogState]);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialogState && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => handleClose(dialogState.type === "prompt" ? null : false)}
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            className="w-full sm:max-w-md bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Grab indicator */}
            <div className="sm:hidden -mt-2 pb-2 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full" />
            </div>

            <div className="flex items-start gap-3.5">
              {/* Variant Icon */}
              <div
                className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center ${
                  dialogState.variant === "danger"
                    ? "bg-error/15 text-error ring-4 ring-error/5"
                    : dialogState.variant === "warning"
                    ? "bg-amber-500/15 text-amber-500 ring-4 ring-amber-500/5"
                    : "bg-action/15 text-action ring-4 ring-action/5"
                }`}
              >
                {dialogState.variant === "danger" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
                  </svg>
                ) : dialogState.variant === "warning" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <h3
                  id="confirm-dialog-title"
                  className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-tight"
                >
                  {dialogState.title}
                </h3>
                {dialogState.message && (
                  <p
                    id="confirm-dialog-desc"
                    className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed break-words"
                  >
                    {dialogState.message}
                  </p>
                )}
              </div>
            </div>

            {/* Prompt Input (if prompt type) */}
            {dialogState.type === "prompt" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClose(dialogState.inputValue);
                }}
                className="mt-1"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={dialogState.inputValue}
                  onChange={(e) =>
                    setDialogState((prev) => ({ ...prev, inputValue: e.target.value }))
                  }
                  placeholder={dialogState.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-action text-sm transition-all"
                />
              </form>
            )}

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 mt-2 pt-2 border-t border-[var(--color-border)]/60">
              <button
                type="button"
                onClick={() => handleClose(dialogState.type === "prompt" ? null : false)}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-[var(--color-border)] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] text-[var(--color-text-primary)] font-medium text-sm transition-all cursor-pointer"
              >
                {dialogState.cancelText}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() =>
                  handleClose(
                    dialogState.type === "prompt" ? dialogState.inputValue : true
                  )
                }
                className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center ${
                  dialogState.variant === "danger"
                    ? "bg-error hover:bg-error/90 active:bg-error/80 text-white"
                    : dialogState.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-action hover:bg-action-hover active:bg-action text-white"
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return async (options) => {
      const msg = typeof options === "string" ? options : (options?.message || options?.title || "Are you sure?");
      return typeof window !== "undefined" ? window.confirm(msg) : true;
    };
  }
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (options) => {
      const msg = typeof options === "string" ? options : (options?.message || "Please enter:");
      return typeof window !== "undefined" ? window.prompt(msg) : null;
    };
  }
  return ctx.prompt;
}
