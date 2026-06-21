import type {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import type { ContactActivityDataByKind } from "@/src/features/contacts/lib/activity-payloads";

type ContactAiActivityEntryBase<K extends ContactActivityKind> = {
  id: string;
  kind: K;
  occurredAt: string;
  summary: string;
  payloadVersion: 1;
  data: ContactActivityDataByKind[K];
  actorName: string | null;
  correlationId: string | null;
  sourceEntity: {
    type: ActivitySourceEntity;
    id: string;
  } | null;
};

export type ContactAiActivityEntry = {
  [K in ContactActivityKind]: ContactAiActivityEntryBase<K>;
}[ContactActivityKind];
