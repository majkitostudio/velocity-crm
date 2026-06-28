"use client";

import { useEffect } from "react";

type ReportsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReportsError({ error, reset }: ReportsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
      <h2 className="text-lg font-semibold text-red-900">Přehledy se nepodařilo načíst</h2>
      <p className="mt-2 text-sm text-red-700">
        Zkontrolujte připojení nebo oprávnění a zkuste to znovu.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
      >
        Zkusit znovu
      </button>
    </div>
  );
}
