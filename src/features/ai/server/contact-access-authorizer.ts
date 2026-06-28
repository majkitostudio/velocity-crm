import "server-only";

import { assertContactAccess } from "@/src/features/contacts/server/contacts.service";

import { assertMinimumRole } from "../services/shared/ai-service-pipeline";
import type { PipelineAuthorizer } from "../services/shared/ai-service-pipeline.types";

export function createContactAccessAuthorizer(): PipelineAuthorizer {
  return {
    async authorize({ companyId, userId, userRole, contactId, minRole }) {
      assertMinimumRole(userRole, minRole);
      await assertContactAccess({
        currentUser: {
          id: userId,
          companyId,
          role: userRole,
        },
        contactId,
      });
    },
  };
}
