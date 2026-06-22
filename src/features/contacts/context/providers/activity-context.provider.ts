import { ContactActivityKind } from "@/src/domain/activity";
import {
  countContactActivitiesByKindForContact,
  countContactActivitiesForContact,
  listContactActivitiesForAiContext,
} from "@/src/features/contacts/server/contact-activity.read.repository";

import { mapContactActivityRowsToEntries } from "../lib/map-activity-rows";
import type { ContactContextProvider } from "../types/contact-context-provider";

export const ACTIVITY_CONTEXT_PROVIDER_VERSION = 1;

export const activityContextProvider: ContactContextProvider<"activity"> = {
  key: "activity",
  version: ACTIVITY_CONTEXT_PROVIDER_VERSION,

  async provide(input, options) {
    const [rows, totalActivityCount, callFinishedCount] = await Promise.all([
      listContactActivitiesForAiContext({
        companyId: input.companyId,
        contactId: input.contactId,
        limit: options.limits.activity,
      }),
      countContactActivitiesForContact({
        companyId: input.companyId,
        contactId: input.contactId,
      }),
      countContactActivitiesByKindForContact({
        companyId: input.companyId,
        contactId: input.contactId,
        kind: ContactActivityKind.CALL_FINISHED,
      }),
    ]);

    return {
      activities: mapContactActivityRowsToEntries(rows),
      aggregates: {
        totalActivityCount,
        callFinishedCount,
      },
    };
  },
};
