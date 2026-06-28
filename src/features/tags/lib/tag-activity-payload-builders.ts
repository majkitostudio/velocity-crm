export function buildContactTagAddedPayload(input: {
  tagId: string;
  tagName: string;
}) {
  return {
    version: 1 as const,
    summary: `Tag přidán: ${input.tagName}`,
    data: {
      tagId: input.tagId,
      tagName: input.tagName,
    },
  };
}

export function buildContactTagRemovedPayload(input: {
  tagId: string;
  tagName: string;
}) {
  return {
    version: 1 as const,
    summary: `Tag odebrán: ${input.tagName}`,
    data: {
      tagId: input.tagId,
      tagName: input.tagName,
    },
  };
}
