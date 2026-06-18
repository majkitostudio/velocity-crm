import type { Metadata } from "next";

import { requireCurrentUser } from "@/src/server/auth/guards";

export const metadata: Metadata = {
  title: "Dashboard — Velocity CRM",
};

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Welcome back{user.name ? `, ${user.name}` : ""}. Operator queue arrives in
          Slice 2.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-sm text-zinc-500">
          Your work queue will appear here — callbacks and assigned leads.
        </p>
      </div>
    </div>
  );
}
