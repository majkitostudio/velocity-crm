import type { ContactContext } from "../context/types/contact-context";
import type {
  ContactDetailContact,
  ContactDetailView,
  ContactNoteView,
} from "../types";
import { buildWorkflowBadge } from "./build-workflow-badge";

function mapContactDetailContact(context: ContactContext): ContactDetailContact {
  const { contact } = context;

  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    street: contact.address.street,
    city: contact.address.city,
    zipCode: contact.address.zipCode,
    country: contact.address.country,
    status: contact.status,
    source: contact.source,
    priority: contact.priority,
    assignedUserId: contact.assignedUser?.id ?? null,
    assignedUser: contact.assignedUser,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

function mapNotes(notes: ContactContext["snapshot"]["notes"]["recent"]): ContactNoteView[] {
  return notes.map((note) => ({
    id: note.id,
    body: note.body,
    createdAt: note.createdAt,
    authorName: note.authorName,
  }));
}

export function mapContactDetailView(
  context: ContactContext,
  options?: {
    sourceCallbackId?: string | null;
    sourceCallbackScheduledAt?: Date | null;
    sourceCallbackNote?: string | null;
  },
): ContactDetailView {
  const contact = mapContactDetailContact(context);
  const { workflow } = context.snapshot;
  const openCallbacks = context.snapshot.callbacks.open.map((callback) => ({
    id: callback.id,
    scheduledAt: callback.scheduledAt,
    status: callback.status,
    note: callback.note,
  }));

  const workflowBadge = buildWorkflowBadge({
    status: contact.status,
    assignedUserId: contact.assignedUserId,
    inProgress: true,
  });

  return {
    contact,
    workflowBadge,
    context: {
      openCallbacks,
      failCount: workflow.failCount,
      failThreshold: workflow.failThreshold,
      lastCall: workflow.lastCall
        ? {
            id: workflow.lastCall.id,
            outcome: workflow.lastCall.outcome,
            createdAt: workflow.lastCall.createdAt,
            operatorName: workflow.lastCall.operatorName,
          }
        : null,
    },
    notes: mapNotes(context.snapshot.notes.recent),
    callWorkflow: {
      failCount: workflow.failCount,
      failThreshold: workflow.failThreshold,
      sourceCallbackId: options?.sourceCallbackId ?? null,
      sourceCallbackScheduledAt: options?.sourceCallbackScheduledAt ?? null,
      sourceCallbackNote: options?.sourceCallbackNote ?? null,
    },
  };
}
