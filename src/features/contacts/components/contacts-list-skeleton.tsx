export function ContactsListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-zinc-100" />
        <div className="h-8 w-40 rounded bg-zinc-200" />
        <div className="h-4 w-72 rounded bg-zinc-100" />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="h-10 rounded bg-zinc-100" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-7 w-16 rounded-full bg-zinc-100" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-zinc-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
