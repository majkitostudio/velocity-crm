import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactDetailPage } from "@/src/features/contacts/components/contact-detail-page";
import { getContactDetailView } from "@/src/features/contacts/server/contact-detail.service";
import { NotFoundError } from "@/src/domain/errors";

type ContactPageProps = {
  params: Promise<{ contactId: string }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { contactId } = await params;

  let view;

  try {
    view = await getContactDetailView(contactId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { title: "Contact not found — Velocity CRM" };
    }

    return { title: "Contact — Velocity CRM" };
  }

  return {
    title: `${view.contact.name} — Velocity CRM`,
  };
}

export default async function ContactDetailRoute({ params }: ContactPageProps) {
  const { contactId } = await params;

  let view;

  try {
    view = await getContactDetailView(contactId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return <ContactDetailPage view={view} />;
}
