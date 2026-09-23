import { useState } from "react";

export default function PasswordInput({ value, onChange, onBlur, error, placeholder = "••••••••", required = true, minLength, autoComplete = "current-password" }) {
  const [visible, setVisible] = useState(false);

  const baseClass = "w-full border outline-none rounded-lg px-3 py-2.5 pr-11 text-sm transition-colors";
  const inputClass = error 
    ? `${baseClass} border-error focus:border-error focus:ring-2 focus:ring-error/20 bg-error/5`
    : `${baseClass} border-border focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 bg-transparent`;

  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClass}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
