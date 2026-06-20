import Link from "next/link";

import { LogoutButton } from "@/src/features/auth/components/logout-button";
import { requireCurrentUser } from "@/src/server/auth/guards";

export default async function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50" data-testid="crm-shell">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold text-emerald-800">
              Velocity CRM
            </Link>
            <nav className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="/callbacks"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Callbacky
              </Link>
              <Link
                href="/products"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Produkty
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-900">
                {user.name ?? user.email}
              </p>
              <p className="text-xs text-zinc-500" data-testid="crm-user-role">
                {user.role}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
