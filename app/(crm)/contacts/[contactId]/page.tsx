import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactDetailPage } from "@/src/features/contacts/components/contact-detail-page";
import { getContactDetailView } from "@/src/features/contacts/server/contact-detail.service";
import { getContactCallbacksPanelView } from "@/src/features/callbacks/server/callbacks.service";
import { NotFoundError } from "@/src/domain/errors";

type ContactPageProps = {
  params: Promise<{ contactId: string }>;
  searchParams: Promise<{ callback?: string; callbackId?: string }>;
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

export default async function ContactDetailRoute({
  params,
  searchParams,
}: ContactPageProps) {
  const { contactId } = await params;
  const { callback, callbackId } = await searchParams;
  const sourceCallbackId = callback ?? callbackId ?? null;

  let view;
  let callbacksPanel;

  try {
    [view, callbacksPanel] = await Promise.all([
      getContactDetailView(contactId, {
        sourceCallbackId,
      }),
      getContactCallbacksPanelView({
        contactId,
        highlightedCallbackId: sourceCallbackId,
      }),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return <ContactDetailPage view={view} callbacksPanel={callbacksPanel} />;
}
