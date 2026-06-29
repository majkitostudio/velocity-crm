import { tagNameSchema } from "@/src/features/tags/schemas";

export const IMPORT_MAX_TAGS_PER_ROW = 10;

export type ParseImportTagCellResult =
  | { ok: true; tagNames: string[] }
  | { ok: false; message: string };

export function parseImportTagCell(raw: string | undefined): ParseImportTagCellResult {
  if (!raw?.trim()) {
    return { ok: true, tagNames: [] };
  }

  const delimiter = raw.includes(";") ? ";" : ",";
  const parts = raw
    .split(delimiter)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return { ok: true, tagNames: [] };
  }

  if (parts.length > IMPORT_MAX_TAGS_PER_ROW) {
    return {
      ok: false,
      message: `Maximálně ${IMPORT_MAX_TAGS_PER_ROW} tagů na řádek`,
    };
  }

  const tagNames: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const normalized = part.replace(/\s+/g, " ");
    const parsed = tagNameSchema.safeParse(normalized);

    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Neplatný název tagu",
      };
    }

    const dedupeKey = parsed.data.toLowerCase();

    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      tagNames.push(parsed.data);
    }
  }

  return { ok: true, tagNames };
}

export function formatImportTagPreview(tagNames: readonly string[]): string {
  if (tagNames.length === 0) {
    return "—";
  }

  return tagNames.join(", ");
}
