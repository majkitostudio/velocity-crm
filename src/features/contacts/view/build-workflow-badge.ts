import { ContactStatus } from "@/src/generated/prisma/client";

import type { ContactWorkflowBadge } from "../types";

export function buildWorkflowBadge(input: {
  status: ContactStatus;
  assignedUserId: string | null;
  inProgress?: boolean;
}): ContactWorkflowBadge {
  if (input.inProgress) {
    return "IN_PROGRESS";
  }

  if (input.status === ContactStatus.LOST) {
    return "FAILED";
  }

  if (
    input.status === ContactStatus.CUSTOMER ||
    input.status === ContactStatus.VIP
  ) {
    return "CONVERTED";
  }

  if (input.status === ContactStatus.LEAD && input.assignedUserId) {
    return "ASSIGNED";
  }

  if (input.status === ContactStatus.LEAD && !input.assignedUserId) {
    return "NEW";
  }

  return "ASSIGNED";
}

export function formatWorkflowBadgeLabel(badge: ContactWorkflowBadge): string {
  switch (badge) {
    case "NEW":
      return "New";
    case "ASSIGNED":
      return "Assigned";
    case "IN_PROGRESS":
      return "In progress";
    case "CONVERTED":
      return "Converted";
    case "FAILED":
      return "Failed";
  }
}
