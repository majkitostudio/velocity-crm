import type { ContactFieldKey } from "../../lib/contact-fields";
import type { ImportColumnMapping, MappedContactDraft, RawImportRow } from "./import.types";

function readMappedValue(
  row: RawImportRow,
  mapping: ImportColumnMapping,
  key: ContactFieldKey,
): string | undefined {
  const column = mapping[key];

  if (!column) {
    return undefined;
  }

  const value = row.cells[column]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function mapRowsToDrafts(input: {
  rows: RawImportRow[];
  mapping: ImportColumnMapping;
}): MappedContactDraft[] {
  return input.rows.map((row) => ({
    rowNumber: row.rowNumber,
    name: readMappedValue(row, input.mapping, "name"),
    phone: readMappedValue(row, input.mapping, "phone"),
    email: readMappedValue(row, input.mapping, "email"),
    priority: readMappedValue(row, input.mapping, "priority"),
    status: readMappedValue(row, input.mapping, "status"),
    street: readMappedValue(row, input.mapping, "street"),
    city: readMappedValue(row, input.mapping, "city"),
    zipCode: readMappedValue(row, input.mapping, "zipCode"),
    country: readMappedValue(row, input.mapping, "country"),
    tags: readMappedValue(row, input.mapping, "tags"),
  }));
}
