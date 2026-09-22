export function MotionLoader({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3" role="status" aria-label={label}>
      <span className="relative flex w-11 h-11">
        <span className="absolute inline-flex h-full w-full rounded-full bg-action/20 animate-ping" />
        <span className="relative inline-flex w-11 h-11 rounded-full bg-primary text-white items-center justify-center text-sm font-extrabold">B</span>
      </span>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <article className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden animate-pulse" aria-hidden="true">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-bg" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/5 rounded bg-bg" />
          <div className="h-2.5 w-1/4 rounded bg-bg" />
        </div>
        <div className="h-6 w-20 rounded-full bg-bg" />
      </div>
      <div className="w-full h-[280px] bg-bg" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-11/12 rounded bg-bg" />
        <div className="h-3 w-full rounded bg-bg" />
        <div className="h-3 w-3/4 rounded bg-bg" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-20 rounded-full bg-bg" />
          <div className="h-7 w-24 rounded-full bg-bg" />
          <div className="h-7 w-20 rounded-full bg-bg ml-auto" />
          <div className="h-7 w-20 rounded-lg bg-bg" />
        </div>
      </div>
    </article>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OpportunityCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StoriesBarSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm p-4 mb-4 max-w-2xl mx-auto animate-pulse" aria-hidden="true">
      <div className="h-3 w-44 rounded bg-bg" />
      <div className="mt-3 flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 text-center">
            <div className="w-[68px] h-[68px] rounded-full bg-bg" />
            <div className="mt-1.5 mx-auto h-2.5 w-12 rounded bg-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReelSkeleton() {
  return (
    <div className="snap-start relative h-[100dvh] w-full bg-black flex items-center justify-center overflow-hidden animate-pulse" aria-hidden="true">
      <div className="h-full w-full max-w-md mx-auto bg-surface/10" />
      <div className="absolute bottom-0 left-0 right-0 p-4 max-w-md mx-auto w-full space-y-2">
        <div className="h-4 w-2/3 rounded bg-surface/20" />
        <div className="h-3 w-1/2 rounded bg-surface/10" />
        <div className="h-3 w-1/3 rounded bg-surface/10" />
      </div>
    </div>
  );
}

export function ReelsSkeleton({ count = 2 }) {
  return (
    <div className="h-[calc(100dvh-64px)] overflow-hidden bg-black">
      {Array.from({ length: count }).map((_, i) => (
        <ReelSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-6 flex gap-4 animate-pulse" aria-hidden="true">
      <div className="w-16 h-16 rounded-full bg-bg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-1/2 rounded bg-bg" />
        <div className="h-3 w-1/3 rounded bg-bg" />
        <div className="h-8 w-24 rounded-full bg-bg" />
      </div>
    </div>
  );
}

export function OpportunityDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 animate-pulse" aria-hidden="true">
      <div className="h-4 w-24 rounded bg-bg" />
      <div className="mt-4 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="w-full h-[360px] bg-bg" />
        <div className="p-6 space-y-3">
          <div className="h-4 w-1/3 rounded bg-bg" />
          <div className="h-6 w-11/12 rounded bg-bg" />
          <div className="h-3 w-full rounded bg-bg" />
          <div className="h-3 w-2/3 rounded bg-bg" />
          <div className="flex gap-2 pt-2">
            <div className="h-9 w-32 rounded-lg bg-bg" />
            <div className="h-9 w-24 rounded-lg bg-bg" />
            <div className="h-9 w-24 rounded-lg bg-bg ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListCardSkeleton({ rows = 4 }) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm divide-y divide-slate-100 overflow-hidden animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-bg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-bg" />
            <div className="h-2.5 w-3/4 rounded bg-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}
