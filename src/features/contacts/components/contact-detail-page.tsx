import type { ReactNode } from "react";

import { CallWorkflowPanel } from "@/src/features/calls/components/call-workflow-panel";
import { ContactCallbacksPanel } from "@/src/features/callbacks/components/contact-callbacks-panel";
import type { ContactCallbacksPanelView } from "@/src/features/callbacks/types";
import type { ContactDetailView } from "../types";
import type { ContactActivityTimelineView } from "../types/activity-timeline";

import { ContactActivityTimeline } from "./contact-activity-timeline";
import { ContactContextCards } from "./contact-context-cards";
import { ContactDetailHeader } from "./contact-detail-header";
import { ContactNotesSection } from "./contact-notes-section";
import type { ContactTagsPanelView } from "@/src/features/tags/types";
import { ContactTagsPanel } from "@/src/features/tags/components/contact-tags-panel";

type ContactDetailPageProps = {
  view: ContactDetailView;
  activityTimeline: ContactActivityTimelineView;
  callbacksPanel: ContactCallbacksPanelView;
  tagsPanel: ContactTagsPanelView;
  returnTo: string;
  showCreatedMessage?: boolean;
  sidebarSlot?: ReactNode;
};

export function ContactDetailPage({
  view,
  activityTimeline,
  callbacksPanel,
  tagsPanel,
  returnTo,
  showCreatedMessage = false,
  sidebarSlot = null,
}: ContactDetailPageProps) {
  return (
    <div className="space-y-6" data-testid="contact-detail-page">
      <ContactDetailHeader
        view={view}
        returnTo={returnTo}
        showCreatedMessage={showCreatedMessage}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <ContactTagsPanel view={tagsPanel} />
          <ContactContextCards context={view.context} />
          <ContactActivityTimeline
            contactId={view.contact.id}
            returnTo={returnTo}
            timeline={activityTimeline}
          />
          <ContactNotesSection contactId={view.contact.id} notes={view.notes} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-40 xl:self-start">
          {sidebarSlot}
          <CallWorkflowPanel
            contactId={view.contact.id}
            sourceCallbackId={view.callWorkflow.sourceCallbackId}
            sourceCallbackScheduledAt={view.callWorkflow.sourceCallbackScheduledAt}
            sourceCallbackNote={view.callWorkflow.sourceCallbackNote}
            failCount={view.callWorkflow.failCount}
            failThreshold={view.callWorkflow.failThreshold}
            nextContactHref={view.callWorkflow.nextContactHref}
          />
          <ContactCallbacksPanel view={callbacksPanel} />
        </aside>
      </div>
    </div>
  );
}
