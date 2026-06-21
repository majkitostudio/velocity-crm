import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  "data-testid"?: string;
};

export function EmptyState({ title, description, action, "data-testid": testId }: EmptyStateProps) {
  return (
    <div
      className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-8 text-center"
      data-testid={testId}
    >
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
