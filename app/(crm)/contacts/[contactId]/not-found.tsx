import Link from "next/link";

export default function ContactNotFound() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">Contact not found</h1>
      <p className="mt-2 text-sm text-zinc-600">
        This contact does not exist or you do not have access to it.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
