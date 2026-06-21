import type { Metadata } from "next";

import { ContactsImportPage } from "@/src/features/contacts/components/import/contacts-import-page";
import { getImportPageView } from "@/src/features/contacts/server/import/import.service";

export const metadata: Metadata = {
  title: "Import CSV — Velocity CRM",
};

type ContactsImportRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactsImportRoute({ searchParams }: ContactsImportRouteProps) {
  const params = await searchParams;
  const view = await getImportPageView(params);

  return <ContactsImportPage view={view} />;
}
