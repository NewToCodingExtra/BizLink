export default function ProgressBar({ className = "", ariaLabel = "Loading" }) {
  return (
    <div className={`h-1.5 rounded-full bg-bg overflow-hidden relative ${className}`} role="status" aria-label={ariaLabel}>
      <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 animate-progress-slide" />
    </div>
  );
}
