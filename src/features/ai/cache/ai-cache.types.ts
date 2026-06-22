import type { AiServiceId } from "../registry/ai-service-id";

export type AiCacheLookup = {
  cacheKey: string;
  companyId: string;
  contactId: string;
  serviceId: AiServiceId;
};

export type CachedAiPayload<TPayload> = {
  payload: TPayload;
  generatedAt: string;
  aiLogId?: string;
};

export type AiCacheWrite<TPayload> = AiCacheLookup & {
  payload: TPayload;
  generatedAt: string;
  aiLogId?: string;
};

export type AiCacheInvalidateScope = {
  companyId: string;
  contactId: string;
  serviceId?: AiServiceId;
};
