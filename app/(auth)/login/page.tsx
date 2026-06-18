import type { Metadata } from "next";

import { LoginForm } from "@/src/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in — Velocity CRM",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Velocity CRM
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Call center workspace for operators and managers.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
