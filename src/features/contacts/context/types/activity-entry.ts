import type {
  ActivitySourceEntity,
  ContactActivityKind,
} from "@/src/domain/activity";
import type { ContactActivityDataByKind } from "@/src/features/contacts/lib/activity-payloads";

type ContactActivityEntryBase<K extends ContactActivityKind> = {
  id: string;
  kind: K;
  occurredAt: Date;
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

export type ContactActivityEntry = {
  [K in ContactActivityKind]: ContactActivityEntryBase<K>;
}[ContactActivityKind];
