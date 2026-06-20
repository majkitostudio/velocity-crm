"use client";

import Link from "next/link";
import { useEffect } from "react";

type ProductsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
      <h2 className="text-lg font-semibold text-red-900">Produkty se nepodařilo načíst</h2>
      <p className="mt-2 text-sm text-red-700">
        Katalog produktů se nepodařilo načíst. Zkuste akci opakovat.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
        >
          Zkusit znovu
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 transition-colors hover:bg-red-100"
        >
          Zpět na dashboard
        </Link>
      </div>
    </div>
  );
}
