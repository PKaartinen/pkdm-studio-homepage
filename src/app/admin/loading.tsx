/** Skeleton shown while an admin view's data loads (navigation feedback). */
export default function AdminLoading() {
  const bar = "admin-skeleton rounded-md bg-white/[0.06]";
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-[fade-up_.3s_ease-out_both]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className={`${bar} h-7 w-48`} />
          <div className={`${bar} h-4 w-80 max-w-full`} />
        </div>
        <div className={`${bar} hidden h-8 w-36 rounded-full sm:block`} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-ink-900/50 p-5">
            <div className={`${bar} h-3 w-20`} />
            <div className={`${bar} mt-3 h-8 w-16`} />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-ink-900/50 p-5">
            <div className="flex items-center gap-3">
              <div className={`${bar} h-10 w-10 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${bar} h-4 w-40`} />
                <div className={`${bar} h-3 w-64 max-w-full`} />
              </div>
            </div>
            <div className={`${bar} mt-4 h-3 w-full`} />
            <div className={`${bar} mt-2 h-3 w-2/3`} />
          </div>
        ))}
      </div>
    </div>
  );
}
