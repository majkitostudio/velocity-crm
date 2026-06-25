import { isDomainError } from "@/src/domain/errors";
import { isLlmError } from "@/src/features/ai/llm/errors/llm-errors";

export function mapContactRecommendationActionError(error: unknown): string {
  if (isDomainError(error)) {
    switch (error.code) {
      case "FORBIDDEN":
        return "Nemáte oprávnění k tomuto kontaktu.";
      case "NOT_FOUND":
        return "Kontakt nebyl nalezen.";
      case "AI_FEATURE_DISABLED":
        return "AI doporučení není dostupné.";
      case "AI_CAPABILITY_ERROR":
        return "AI funkce není podporována aktuálním modelem.";
      case "LLM_INVALID_RESPONSE":
      case "LLM_SCHEMA_VALIDATION":
        return "Nepodařilo se zpracovat odpověď AI. Zkuste to znovu.";
      case "LLM_PROVIDER_NOT_CONFIGURED":
      case "LLM_PROVIDER_UNAVAILABLE":
        return "AI služba je dočasně nedostupná.";
      default:
        break;
    }
  }

  if (isLlmError(error)) {
    return "Generování doporučení selhalo. Zkuste to znovu.";
  }

  return "Neočekávaná chyba. Zkuste to znovu.";
}
