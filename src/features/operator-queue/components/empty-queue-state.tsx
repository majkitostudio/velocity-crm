type EmptyQueueStateProps = {
  title: string;
  description: string;
};

export function EmptyQueueState({ title, description }: EmptyQueueStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
