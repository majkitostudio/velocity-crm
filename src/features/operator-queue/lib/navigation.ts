import type { OperatorQueueItem } from "../types";

export function buildQueueContactHref(item: OperatorQueueItem): string {
  if (item.kind === "CALLBACK") {
    return `/contacts/${item.contact.id}?callback=${item.callbackId}`;
  }

  return `/contacts/${item.contact.id}`;
}
