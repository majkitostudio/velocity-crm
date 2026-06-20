const CONTACTS_PATH = "/contacts";

export function buildContactsListPath(
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query.length > 0 ? `${CONTACTS_PATH}?${query}` : CONTACTS_PATH;
}

export function buildContactDetailHref(input: {
  contactId: string;
  returnTo: string;
}): string {
  const params = new URLSearchParams({
    returnTo: input.returnTo,
  });

  return `/contacts/${input.contactId}?${params.toString()}`;
}

export function parseReturnToPath(value: string | undefined): string {
  if (!value || !value.startsWith(CONTACTS_PATH)) {
    return CONTACTS_PATH;
  }

  return value;
}
