type PanelShellProps = {
  title: string;
  description: string;
  sliceLabel: string;
};

export function PanelShell({ title, description, sliceLabel }: PanelShellProps) {
  return (
    <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
          {sliceLabel}
        </span>
      </div>
    </section>
  );
}
