/**
 * Canonical contact field catalog.
 * Internal definitions carry full metadata; public helpers expose a stable API
 * so new metadata (exportable, aiVisible, …) can be added without breaking callers.
 */

export const CONTACT_FIELD_KEYS = [
  "name",
  "phone",
  "email",
  "priority",
  "status",
  "street",
  "city",
  "zipCode",
  "country",
] as const;

export type ContactFieldKey = (typeof CONTACT_FIELD_KEYS)[number];

type ContactFieldDefinition = {
  label: string;
  requiredOnImport: boolean;
  exportable: boolean;
  searchable: boolean;
  filterable: boolean;
  aiVisible: boolean;
  aliases: readonly string[];
  importOrder: number;
};

const CONTACT_FIELD_DEFINITIONS: Record<ContactFieldKey, ContactFieldDefinition> = {
  name: {
    label: "Jméno",
    requiredOnImport: true,
    exportable: true,
    searchable: true,
    filterable: false,
    aiVisible: true,
    aliases: ["name", "jmeno", "jméno", "full name", "fullname", "kontakt"],
    importOrder: 10,
  },
  phone: {
    label: "Telefon",
    requiredOnImport: true,
    exportable: true,
    searchable: true,
    filterable: false,
    aiVisible: true,
    aliases: ["phone", "telefon", "tel", "mobil", "mobile", "phone number"],
    importOrder: 20,
  },
  email: {
    label: "E-mail",
    requiredOnImport: false,
    exportable: true,
    searchable: true,
    filterable: false,
    aiVisible: true,
    aliases: ["email", "e-mail", "mail"],
    importOrder: 30,
  },
  priority: {
    label: "Priorita",
    requiredOnImport: false,
    exportable: true,
    searchable: false,
    filterable: true,
    aiVisible: true,
    aliases: ["priority", "priorita"],
    importOrder: 40,
  },
  status: {
    label: "Stav",
    requiredOnImport: false,
    exportable: true,
    searchable: false,
    filterable: true,
    aiVisible: true,
    aliases: ["status", "stav"],
    importOrder: 50,
  },
  street: {
    label: "Ulice",
    requiredOnImport: false,
    exportable: true,
    searchable: false,
    filterable: false,
    aiVisible: true,
    aliases: ["street", "ulice", "address", "adresa"],
    importOrder: 60,
  },
  city: {
    label: "Město",
    requiredOnImport: false,
    exportable: true,
    searchable: false,
    filterable: false,
    aiVisible: true,
    aliases: ["city", "mesto", "město"],
    importOrder: 70,
  },
  zipCode: {
    label: "PSČ",
    requiredOnImport: false,
    exportable: true,
    searchable: false,
    filterable: false,
    aiVisible: false,
    aliases: ["zip", "zipcode", "zip code", "psc", "psč", "postal"],
    importOrder: 80,
  },
  country: {
    label: "Země",
    requiredOnImport: false,
    exportable: true,
    searchable: false,
    filterable: false,
    aiVisible: false,
    aliases: ["country", "zeme", "země", "state"],
    importOrder: 90,
  },
};

export type ContactFieldCatalogEntry = {
  key: ContactFieldKey;
  label: string;
  requiredOnImport: boolean;
  importOrder: number;
};

function toCatalogEntry(key: ContactFieldKey): ContactFieldCatalogEntry {
  const definition = CONTACT_FIELD_DEFINITIONS[key];

  return {
    key,
    label: definition.label,
    requiredOnImport: definition.requiredOnImport,
    importOrder: definition.importOrder,
  };
}

export function getContactFieldDefinition(
  key: ContactFieldKey,
): Readonly<ContactFieldDefinition> {
  return CONTACT_FIELD_DEFINITIONS[key];
}

export function listContactFieldCatalog(): readonly ContactFieldCatalogEntry[] {
  return CONTACT_FIELD_KEYS.map(toCatalogEntry).sort(
    (left, right) => left.importOrder - right.importOrder,
  );
}

export function listImportMappableContactFields(): readonly ContactFieldCatalogEntry[] {
  return listContactFieldCatalog();
}

export function listRequiredImportFieldKeys(): ContactFieldKey[] {
  return CONTACT_FIELD_KEYS.filter(
    (key) => CONTACT_FIELD_DEFINITIONS[key].requiredOnImport,
  );
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function suggestImportColumnMapping(
  headers: readonly string[],
): Partial<Record<ContactFieldKey, string>> {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  const mapping: Partial<Record<ContactFieldKey, string>> = {};
  const usedHeaders = new Set<string>();

  for (const key of CONTACT_FIELD_KEYS) {
    const definition = CONTACT_FIELD_DEFINITIONS[key];
    const match = normalizedHeaders.find(
      (header) =>
        !usedHeaders.has(header.original) &&
        definition.aliases.some((alias) => alias === header.normalized),
    );

    if (match) {
      mapping[key] = match.original;
      usedHeaders.add(match.original);
    }
  }

  return mapping;
}

export function isCompleteImportColumnMapping(
  mapping: Partial<Record<ContactFieldKey, string | null | undefined>>,
): boolean {
  return listRequiredImportFieldKeys().every((key) => {
    const column = mapping[key];
    return typeof column === "string" && column.trim().length > 0;
  });
}
