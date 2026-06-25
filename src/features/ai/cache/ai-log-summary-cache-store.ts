import "server-only";

import { randomBytes } from "node:crypto";

import type { PrismaClient } from "@/src/generated/prisma/client";
import { AiLogStatus, AiTaskType } from "@/src/generated/prisma/client";
import type { AiCacheStore } from "@/src/features/ai/cache/ai-cache-store";
import type {
  AiCacheInvalidateScope,
  AiCacheLookup,
  AiCacheWrite,
  CachedAiPayload,
} from "@/src/features/ai/cache/ai-cache.types";
import type { LlmModelRef } from "@/src/features/ai/llm/types/llm-model";
import { contactSummarySchema, type ContactSummary } from "@/src/features/ai/prompts/summary/summary-output-schema";
import type { AiServiceDescriptor } from "@/src/features/ai/registry/ai-service-descriptor";
import { isAiLogMetadata } from "@/src/features/ai/server/ai-log-metadata";
import type { AiLogMetadata } from "@/src/features/ai/server/ai-log-metadata";
import type { PipelineAuditLogger } from "@/src/features/ai/services/shared/ai-service-pipeline.types";
import { parseCacheKey } from "@/src/features/ai/services/shared/ai-service-pipeline.types";

const CONTACT_SUMMARY_TASK_TYPE: AiTaskType = "CUSTOMER_SUMMARY";
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
}): AiLogMetadata {
  const parsed = parseCacheKey(input.cacheKey);

  return {
    promptVersion: parsed.promptVersion,
    promptId: "summary",
    outputSchemaVersion: parsed.outputSchemaVersion,
    contextSchemaVersion: CONTEXT_SCHEMA_VERSION,
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

export type CreateAiLogSummaryPersistenceOptions = {
  prisma: PrismaClient;
  taskType?: AiTaskType;
};

export type AiLogSummaryPersistence = {
  cacheStore: AiCacheStore<ContactSummary>;
  auditLogger: PipelineAuditLogger;
};

export function createAiLogSummaryPersistence(
  options: CreateAiLogSummaryPersistenceOptions,
): AiLogSummaryPersistence {
  const taskType = options.taskType ?? CONTACT_SUMMARY_TASK_TYPE;
  const pendingSuccessWrites = new Map<string, PendingSuccessWrite>();

  const cacheStore: AiCacheStore<ContactSummary> = {
    async find(lookup: AiCacheLookup): Promise<CachedAiPayload<ContactSummary> | null> {
      const parsed = parseCacheKey(lookup.cacheKey);
      const row = await options.prisma.aiLog.findFirst({
        where: {
          companyId: lookup.companyId,
          contactId: lookup.contactId,
          taskType,
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

      let payload: ContactSummary;
      try {
        const parsedOutput = JSON.parse(row.output) as unknown;
        payload = contactSummarySchema.parse(parsedOutput);
      } catch {
        return null;
      }

      return {
        payload,
        generatedAt: metadata.generatedAt,
        aiLogId: row.id,
      };
    },

    async upsert(write: AiCacheWrite<ContactSummary>): Promise<void> {
      if (!write.aiLogId) {
        throw new Error("AiLogSummaryCacheStore.upsert requires aiLogId from audit logger");
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
      });

      await options.prisma.aiLog.create({
        data: {
          id: write.aiLogId,
          companyId: write.companyId,
          contactId: write.contactId,
          userId: pending.userId,
          taskType,
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
      // Phase 1: append-only AiLog — explicit invalidation is a no-op.
      // Context changes produce a new contextHash and therefore a cache miss.
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
          taskType,
          model: "unknown/unknown",
          promptSummary: buildPromptSummary(input.descriptor),
          output: "",
          status: AiLogStatus.FAILED,
          metadata: {
            promptVersion: input.descriptor.defaultPromptVersion,
            promptId: "summary",
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

export function createAiLogSummaryCacheStore(
  options: CreateAiLogSummaryPersistenceOptions,
): AiCacheStore<ContactSummary> {
  return createAiLogSummaryPersistence(options).cacheStore;
}
