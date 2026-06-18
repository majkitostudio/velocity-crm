export default function ContactDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading contact">
      <div className="h-36 animate-pulse rounded-xl bg-zinc-200" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="h-28 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-28 animate-pulse rounded-xl bg-zinc-200" />
            <div className="h-28 animate-pulse rounded-xl bg-zinc-200" />
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200" />
        </div>
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-28 animate-pulse rounded-xl bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
