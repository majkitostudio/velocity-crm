import "server-only";

import {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import { ConflictError, ForbiddenError, NotFoundError } from "@/src/domain/errors";
import { AuditActions, AuditEntityTypes } from "@/src/domain/events";
import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";
import { recordContactBusinessEvent } from "@/src/features/contacts/server/record-contact-business-event";
import {
  canManageCompanyData,
  requireCurrentUser,
} from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

import {
  buildContactTagAddedPayload,
  buildContactTagRemovedPayload,
} from "../lib/tag-activity-payload-builders";
import type { ContactTagsPanelView } from "../types";
import {
  createContactTagAssignment,
  createTagForCompany,
  findContactIdsForTag,
  findTagByIdForCompany,
  findTagByNameForCompany,
  findTagsForCompany,
  findTagsForContact,
} from "./tags.repository";

function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export async function getContactTagsPanelView(
  contactId: string,
): Promise<ContactTagsPanelView> {
  const currentUser = await requireCurrentUser();

  await assertContactAccess({
    currentUser,
    contactId,
  });

  const [assignedRows, availableTags] = await Promise.all([
    findTagsForContact({
      companyId: currentUser.companyId,
      contactId,
    }),
    findTagsForCompany(currentUser.companyId),
  ]);

  const assignedTagIds = new Set(assignedRows.map((row) => row.tag.id));

  return {
    contactId,
    tags: assignedRows.map((row) => row.tag),
    availableTags: availableTags.filter((tag) => !assignedTagIds.has(tag.id)),
    canManageTags: canManageCompanyData(currentUser.role),
  };
}

export async function assignTagToContact(input: {
  contactId: string;
  tagId: string;
}): Promise<void> {
  const currentUser = await requireCurrentUser();

  if (!canManageCompanyData(currentUser.role)) {
    throw new ForbiddenError();
  }

  await assertContactAccess({
    currentUser,
    contactId: input.contactId,
  });

  const tag = await findTagByIdForCompany({
    companyId: currentUser.companyId,
    tagId: input.tagId,
  });

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await createContactTagAssignment(tx, {
        companyId: currentUser.companyId,
        contactId: input.contactId,
        tagId: tag.id,
      });

      await recordContactBusinessEvent({
        tx,
        companyId: currentUser.companyId,
        contactId: input.contactId,
        actorUserId: currentUser.id,
        occurredAt: new Date(),
        activity: {
          kind: ContactActivityKind.CONTACT_TAG_ADDED,
          payload: buildContactTagAddedPayload({
            tagId: tag.id,
            tagName: tag.name,
          }),
          sourceEntity: {
            type: ActivitySourceEntity.TAG,
            id: tag.id,
          },
        },
        audit: {
          action: AuditActions.CONTACT_UPDATED,
          entityType: AuditEntityTypes.CONTACT,
          entityId: input.contactId,
          metadata: {
            tagId: tag.id,
            tagName: tag.name,
            change: "tag_added",
          },
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      throw new ConflictError("Tag is already assigned to this contact");
    }

    throw error;
  }
}

export async function createTagAndAssignToContact(input: {
  contactId: string;
  name: string;
}): Promise<void> {
  const currentUser = await requireCurrentUser();

  if (!canManageCompanyData(currentUser.role)) {
    throw new ForbiddenError();
  }

  await assertContactAccess({
    currentUser,
    contactId: input.contactId,
  });

  const normalizedName = normalizeTagName(input.name);

  await prisma.$transaction(async (tx) => {
    const existing = await findTagByNameForCompany({
      companyId: currentUser.companyId,
      name: normalizedName,
    });

    const tag =
      existing ??
      (await createTagForCompany(tx, {
        companyId: currentUser.companyId,
        name: normalizedName,
      }));

    try {
      await createContactTagAssignment(tx, {
        companyId: currentUser.companyId,
        contactId: input.contactId,
        tagId: tag.id,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        throw new ConflictError("Tag is already assigned to this contact");
      }

      throw error;
    }

    await recordContactBusinessEvent({
      tx,
      companyId: currentUser.companyId,
      contactId: input.contactId,
      actorUserId: currentUser.id,
      occurredAt: new Date(),
      activity: {
        kind: ContactActivityKind.CONTACT_TAG_ADDED,
        payload: buildContactTagAddedPayload({
          tagId: tag.id,
          tagName: tag.name,
        }),
        sourceEntity: {
          type: ActivitySourceEntity.TAG,
          id: tag.id,
        },
      },
      audit: {
        action: AuditActions.CONTACT_UPDATED,
        entityType: AuditEntityTypes.CONTACT,
        entityId: input.contactId,
        metadata: {
          tagId: tag.id,
          tagName: tag.name,
          change: "tag_added",
        },
      },
    });
  });
}

export async function removeTagFromContact(input: {
  contactId: string;
  tagId: string;
}): Promise<void> {
  const currentUser = await requireCurrentUser();

  if (!canManageCompanyData(currentUser.role)) {
    throw new ForbiddenError();
  }

  await assertContactAccess({
    currentUser,
    contactId: input.contactId,
  });

  const tag = await findTagByIdForCompany({
    companyId: currentUser.companyId,
    tagId: input.tagId,
  });

  if (!tag) {
    throw new NotFoundError("Tag not found");
  }

  await prisma.$transaction(async (tx) => {
    const result = await tx.contactTag.deleteMany({
      where: {
        companyId: currentUser.companyId,
        contactId: input.contactId,
        tagId: tag.id,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Tag assignment not found");
    }

    await recordContactBusinessEvent({
      tx,
      companyId: currentUser.companyId,
      contactId: input.contactId,
      actorUserId: currentUser.id,
      occurredAt: new Date(),
      activity: {
        kind: ContactActivityKind.CONTACT_TAG_REMOVED,
        payload: buildContactTagRemovedPayload({
          tagId: tag.id,
          tagName: tag.name,
        }),
        sourceEntity: {
          type: ActivitySourceEntity.TAG,
          id: tag.id,
        },
      },
      audit: {
        action: AuditActions.CONTACT_UPDATED,
        entityType: AuditEntityTypes.CONTACT,
        entityId: input.contactId,
        metadata: {
          tagId: tag.id,
          tagName: tag.name,
          change: "tag_removed",
        },
      },
    });
  });
}

export async function listContactIdsForTagFilter(input: {
  companyId: string;
  tagId: string;
}): Promise<string[]> {
  const tag = await findTagByIdForCompany({
    companyId: input.companyId,
    tagId: input.tagId,
  });

  if (!tag) {
    return [];
  }

  return findContactIdsForTag({
    companyId: input.companyId,
    tagId: input.tagId,
  });
}

export async function listTagsForCompanyFilter(companyId: string) {
  return findTagsForCompany(companyId);
}
