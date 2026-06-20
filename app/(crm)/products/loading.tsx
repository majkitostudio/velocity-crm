export default function ProductsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Načítám produkty">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-8 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="h-16 w-44 animate-pulse rounded-xl bg-zinc-200" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-48 animate-pulse rounded-xl bg-zinc-200" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-zinc-200" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-44 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-44 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-44 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    </div>
  );
}
