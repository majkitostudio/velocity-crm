import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactDetailPage } from "@/src/features/contacts/components/contact-detail-page";
import { getContactDetailView } from "@/src/features/contacts/server/contact-detail.service";
import { getContactActivityTimelineFromSearchParams } from "@/src/features/contacts/server/contact-activity.service";
import { getContactCallbacksPanelView } from "@/src/features/callbacks/server/callbacks.service";
import { parseReturnToPath } from "@/src/features/contacts/lib/list-navigation";
import { ContactAiSummaryPanel } from "@/src/features/ai/components/contact-ai-summary-panel";
import { isContactSummaryRefreshEnabled, isContactSummaryUiEnabled } from "@/src/features/ai/server/contact-summary-ui";
import { NotFoundError } from "@/src/domain/errors";

type ContactPageProps = {
  params: Promise<{ contactId: string }>;
  searchParams: Promise<{
    callback?: string;
    callbackId?: string;
    returnTo?: string;
    created?: string;
    activity?: string;
    activityPeriod?: string;
    activityCursor?: string;
  }>;
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
  const resolvedSearchParams = await searchParams;
  const { callback, callbackId, returnTo, created } = resolvedSearchParams;
  const sourceCallbackId = callback ?? callbackId ?? null;
  const contactsReturnTo = parseReturnToPath(returnTo);
  const showCreatedMessage = created === "1";

  let view;
  let activityTimeline;
  let callbacksPanel;
  let showAiSummary = false;
  let showAiSummaryRefresh = false;

  try {
    [view, activityTimeline, callbacksPanel, showAiSummary, showAiSummaryRefresh] = await Promise.all([
      getContactDetailView(contactId, {
        sourceCallbackId,
      }),
      getContactActivityTimelineFromSearchParams({
        contactId,
        searchParams: resolvedSearchParams,
      }),
      getContactCallbacksPanelView({
        contactId,
        highlightedCallbackId: sourceCallbackId,
      }),
      isContactSummaryUiEnabled(),
      isContactSummaryRefreshEnabled(),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <ContactDetailPage
      view={view}
      activityTimeline={activityTimeline}
      callbacksPanel={callbacksPanel}
      returnTo={contactsReturnTo}
      showCreatedMessage={showCreatedMessage}
      sidebarSlot={
        showAiSummary ? (
          <ContactAiSummaryPanel contactId={contactId} refreshEnabled={showAiSummaryRefresh} />
        ) : null
      }
    />
  );
}
