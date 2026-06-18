"use client";

import Link from "next/link";
import { useEffect } from "react";

type ContactDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ContactDetailError({ error, reset }: ContactDetailErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
      <h2 className="text-lg font-semibold text-red-900">Unable to load contact</h2>
      <p className="mt-2 text-sm text-red-700">
        The contact detail could not be loaded. Check your connection and try again.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 transition-colors hover:bg-red-100"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
