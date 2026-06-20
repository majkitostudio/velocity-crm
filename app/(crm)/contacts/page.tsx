import type { Metadata } from "next";

import { ContactsPage } from "@/src/features/contacts/components/contacts-page";
import { getContactsPageView } from "@/src/features/contacts/server/contacts-list.service";

export const metadata: Metadata = {
  title: "Kontakty — Velocity CRM",
};

type ContactsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactsRoute({ searchParams }: ContactsRouteProps) {
  const params = await searchParams;
  const view = await getContactsPageView(params);

  return <ContactsPage view={view} />;
}
