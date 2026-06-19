import "server-only";

import { AiTaskType, type AiLog } from "@/src/generated/prisma/client";
import { NotFoundError } from "@/src/domain/errors";
import { requireCurrentUser } from "@/src/server/auth/guards";
import { prisma } from "@/src/server/db";

export async function createAiLog(input: {
  contactId: string;
  taskType: AiTaskType;
  model: string;
  promptSummary: string;
  output: string;
}): Promise<AiLog> {
  const currentUser = await requireCurrentUser();

  const contact = await prisma.contact.findFirst({
    where: {
      id: input.contactId,
      companyId: currentUser.companyId,
    },
    select: {
      id: true,
    },
  });

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  return prisma.aiLog.create({
    data: {
      companyId: currentUser.companyId,
      contactId: contact.id,
      userId: currentUser.id,
      taskType: input.taskType,
      model: input.model,
      promptSummary: input.promptSummary,
      output: input.output,
    },
  });
}
