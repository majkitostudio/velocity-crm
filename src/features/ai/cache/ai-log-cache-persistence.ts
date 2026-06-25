import "server-only";

import { randomBytes } from "node:crypto";

import type { z } from "zod";

import type { PrismaClient } from "@/src/generated/prisma/client";
import { AiLogStatus, type AiTaskType } from "@/src/generated/prisma/client";
import type { LlmModelRef } from "@/src/features/ai/llm/types/llm-model";
import type { PromptTemplateId } from "@/src/features/ai/prompts/types/prompt-template";
import type { AiTaskCategory } from "@/src/features/ai/registry/ai-task-category";
import type { AiServiceDescriptor } from "@/src/features/ai/registry/ai-service-descriptor";
import { isAiLogMetadata } from "@/src/features/ai/server/ai-log-metadata";
import type { AiLogMetadata } from "@/src/features/ai/server/ai-log-metadata";
import type { PipelineAuditLogger } from "@/src/features/ai/services/shared/ai-service-pipeline.types";
import { parseCacheKey } from "@/src/features/ai/services/shared/ai-service-pipeline.types";

import type { AiCacheStore } from "./ai-cache-store";
import type {
  AiCacheInvalidateScope,
  AiCacheLookup,
  AiCacheWrite,
  CachedAiPayload,
} from "./ai-cache.types";

const CONTEXT_SCHEMA_VERSION = 1;

type PendingSuccessWrite = {
  companyId: string;
  userId: string;
  contactId: string;
  descriptor: AiServiceDescriptor;
  correlationId: string;
  model: LlmModelRef;
  outputJson: string;
  latencyMs: number;
  occurredAt: string;
};

function createAiLogId(): string {
  return `ailog_${randomBytes(16).toString("hex")}`;
}

function formatModelRef(model: LlmModelRef): string {
  return `${model.vendor}/${model.modelId}`;
}

function buildPromptSummary(descriptor: AiServiceDescriptor): string {
  return `${descriptor.taskProfile.toLowerCase()}@${descriptor.defaultPromptVersion}`;
}

function buildMetadata(input: {
  cacheKey: string;
  descriptor: AiServiceDescriptor;
  correlationId: string;
  model: LlmModelRef;
  generatedAt: string;
  promptId: PromptTemplateId;
  taskCategory: AiTaskCategory;
}): AiLogMetadata {
  const parsed = parseCacheKey(input.cacheKey);

  return {
    promptVersion: parsed.promptVersion,
    promptId: input.promptId,
    outputSchemaVersion: parsed.outputSchemaVersion,
    contextSchemaVersion: CONTEXT_SCHEMA_VERSION,
    taskCategory: input.taskCategory,
    taskProfile: input.descriptor.taskProfile,
    vendor: input.model.vendor,
    modelId: input.model.modelId,
    correlationId: input.correlationId,
    contextHash: parsed.contextHash,
    cacheKey: input.cacheKey,
    locale: parsed.locale,
    generatedAt: input.generatedAt,
    fromCache: false,
  };
}

export type CreateAiLogCachePersistenceOptions<TPayload> = {
  prisma: PrismaClient;
  taskType: AiTaskType;
  taskCategory: AiTaskCategory;
  promptId: PromptTemplateId;
  outputSchema: z.ZodSchema<TPayload>;
};

export type AiLogCachePersistence<TPayload> = {
  cacheStore: AiCacheStore<TPayload>;
  auditLogger: PipelineAuditLogger;
};

export function createAiLogCachePersistence<TPayload>(
  options: CreateAiLogCachePersistenceOptions<TPayload>,
): AiLogCachePersistence<TPayload> {
  const pendingSuccessWrites = new Map<string, PendingSuccessWrite>();

  const cacheStore: AiCacheStore<TPayload> = {
    async find(lookup: AiCacheLookup): Promise<CachedAiPayload<TPayload> | null> {
      const parsed = parseCacheKey(lookup.cacheKey);
      const row = await options.prisma.aiLog.findFirst({
        where: {
          companyId: lookup.companyId,
          contactId: lookup.contactId,
          taskType: options.taskType,
          status: AiLogStatus.SUCCESS,
          metadata: {
            path: ["cacheKey"],
            equals: lookup.cacheKey,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          output: true,
          metadata: true,
        },
      });

      if (!row) {
        return null;
      }

      const metadata = isAiLogMetadata(row.metadata) ? row.metadata : null;
      if (!metadata || metadata.contextHash !== parsed.contextHash) {
        return null;
      }

      try {
        const parsedOutput = JSON.parse(row.output) as unknown;
        const payload = options.outputSchema.parse(parsedOutput);
        return {
          payload,
          generatedAt: metadata.generatedAt,
          aiLogId: row.id,
          telemetryMetadata: {
            provider: metadata.vendor,
            modelId: metadata.modelId,
            promptVersion: metadata.promptVersion,
            promptId: metadata.promptId,
          },
        };
      } catch {
        return null;
      }
    },

    async upsert(write: AiCacheWrite<TPayload>): Promise<void> {
      if (!write.aiLogId) {
        throw new Error("AiLogCacheStore.upsert requires aiLogId from audit logger");
      }

      const pending = pendingSuccessWrites.get(write.aiLogId);
      if (!pending) {
        throw new Error(`Missing pending AiLog write for id ${write.aiLogId}`);
      }

      pendingSuccessWrites.delete(write.aiLogId);

      const metadata = buildMetadata({
        cacheKey: write.cacheKey,
        descriptor: pending.descriptor,
        correlationId: pending.correlationId,
        model: pending.model,
        generatedAt: write.generatedAt,
        promptId: options.promptId,
        taskCategory: options.taskCategory,
      });

      await options.prisma.aiLog.create({
        data: {
          id: write.aiLogId,
          companyId: write.companyId,
          contactId: write.contactId,
          userId: pending.userId,
          taskType: options.taskType,
          model: formatModelRef(pending.model),
          promptSummary: buildPromptSummary(pending.descriptor),
          output: JSON.stringify(write.payload),
          status: AiLogStatus.SUCCESS,
          metadata,
          latencyMs: pending.latencyMs,
          createdAt: new Date(write.generatedAt),
        },
      });
    },

    async invalidate(scope: AiCacheInvalidateScope): Promise<void> {
      void scope;
    },
  };

  const auditLogger: PipelineAuditLogger = {
    async recordSuccess(input) {
      const aiLogId = createAiLogId();
      pendingSuccessWrites.set(aiLogId, {
        companyId: input.companyId,
        userId: input.userId,
        contactId: input.contactId,
        descriptor: input.descriptor,
        correlationId: input.correlationId,
        model: input.model,
        outputJson: input.outputJson,
        latencyMs: input.latencyMs,
        occurredAt: input.occurredAt,
      });
      return { aiLogId };
    },

    async recordFailure(input) {
      await options.prisma.aiLog.create({
        data: {
          companyId: input.companyId,
          contactId: input.contactId,
          userId: input.userId,
          taskType: options.taskType,
          model: "unknown/unknown",
          promptSummary: buildPromptSummary(input.descriptor),
          output: "",
          status: AiLogStatus.FAILED,
          metadata: {
            promptVersion: input.descriptor.defaultPromptVersion,
            promptId: options.promptId,
            taskCategory: options.taskCategory,
            correlationId: input.correlationId,
            errorCode: input.errorCode,
          },
          latencyMs: input.latencyMs,
          errorCode: input.errorCode,
          createdAt: new Date(input.occurredAt),
        },
      });
    },
  };

  return { cacheStore, auditLogger };
}
