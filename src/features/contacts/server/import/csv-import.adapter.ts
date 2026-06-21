import type { ImportParseInput, ImportSourceAdapter, RawImportRow } from "./import.types";

function detectDelimiter(line: string): "," | ";" {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;

  return semicolons > commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells;
}

function parseCsvContent(content: string): { headers: string[]; rows: RawImportRow[] } {
  const normalized = content.replace(/^\uFEFF/, "").trim();

  if (normalized.length === 0) {
    return { headers: [], rows: [] };
  }

  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(lines[0] ?? "");
  const headerCells = parseCsvLine(lines[0] ?? "", delimiter);
  const headers = headerCells.map((cell, index) => cell || `column_${index + 1}`);

  const rows: RawImportRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = parseCsvLine(lines[lineIndex] ?? "", delimiter);
    const rowCells: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowCells[header] = cells[index]?.trim() ?? "";
    });

    rows.push({
      rowNumber: lineIndex + 1,
      cells: rowCells,
    });
  }

  return { headers, rows };
}

export const csvImportAdapter: ImportSourceAdapter = {
  sourceType: "CSV",
  parse(input: ImportParseInput) {
    return parseCsvContent(input.content);
  },
};
