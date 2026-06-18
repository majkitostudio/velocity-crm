export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded bg-zinc-200" />
        <div className="h-4 w-64 rounded bg-zinc-100" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="mt-3 h-8 w-12 rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-32 rounded bg-zinc-100" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-6 w-32 rounded bg-zinc-200" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-zinc-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
