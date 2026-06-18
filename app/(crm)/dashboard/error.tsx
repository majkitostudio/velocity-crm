"use client";

import { useEffect } from "react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
      <h2 className="text-lg font-semibold text-red-900">Unable to load dashboard</h2>
      <p className="mt-2 text-sm text-red-700">
        The operator queue could not be loaded. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
