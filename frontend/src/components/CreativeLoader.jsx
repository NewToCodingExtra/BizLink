import React from 'react';

export default function CreativeLoader({ text, fullScreen = true }) {
  const containerClass = fullScreen 
    ? "flex flex-col items-center justify-center min-h-[calc(100vh-64px)] w-full" 
    : "flex flex-col items-center justify-center py-12 w-full";

  return (
    <div className={containerClass}>
      <div className="relative w-16 h-16 flex items-center justify-center drop-shadow-lg mb-4">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-transparent border-t-[var(--color-accent)] border-b-[var(--color-action)] animate-spin opacity-80" />
        
        {/* Inner reverse spinning ring */}
        <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-transparent border-r-[var(--color-action)] border-l-[var(--color-accent)] animate-spin-reverse opacity-60" />
        
        {/* Center geometric element */}
        <div className="absolute flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5 text-[var(--color-text-primary)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 12l10 10 10-10L12 2z" />
          </svg>
        </div>
      </div>
      {text && (
        <div className="text-sm font-medium text-[var(--color-text-secondary)] tracking-widest uppercase animate-pulse">
          {text}
        </div>
      )}
    </div>
  );
}
