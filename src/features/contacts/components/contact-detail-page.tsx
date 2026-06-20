import { CallWorkflowPanel } from "@/src/features/calls/components/call-workflow-panel";
import { ContactCallbacksPanel } from "@/src/features/callbacks/components/contact-callbacks-panel";
import type { ContactCallbacksPanelView } from "@/src/features/callbacks/types";
import type { ContactDetailView } from "../types";

import { ContactActivityTimeline } from "./contact-activity-timeline";
import { ContactContextCards } from "./contact-context-cards";
import { ContactDetailHeader } from "./contact-detail-header";
import { ContactNotesSection } from "./contact-notes-section";

type ContactDetailPageProps = {
  view: ContactDetailView;
  callbacksPanel: ContactCallbacksPanelView;
  returnTo: string;
  showCreatedMessage?: boolean;
};

export function ContactDetailPage({
  view,
  callbacksPanel,
  returnTo,
  showCreatedMessage = false,
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
          <ContactContextCards context={view.context} />
          <ContactActivityTimeline items={view.activity} />
          <ContactNotesSection contactId={view.contact.id} notes={view.notes} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-40 xl:self-start">
          <CallWorkflowPanel
            contactId={view.contact.id}
            sourceCallbackId={view.callWorkflow.sourceCallbackId}
            sourceCallbackScheduledAt={view.callWorkflow.sourceCallbackScheduledAt}
            sourceCallbackNote={view.callWorkflow.sourceCallbackNote}
            failCount={view.callWorkflow.failCount}
            failThreshold={view.callWorkflow.failThreshold}
          />
          <ContactCallbacksPanel view={callbacksPanel} />
        </aside>
      </div>
    </div>
  );
}
