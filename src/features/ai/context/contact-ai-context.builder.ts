import {
  createEmptyContactAiProfile,
  createEmptySnapshot,
  EMPTY_HISTORY,
  EMPTY_STATISTICS,
  freezeContactAiContext,
} from "./lib/contact-ai-context-defaults";
import { resolveProvidersForSections } from "./providers/provider-registry";
import { createContactAiStatistics } from "./statistics/create-contact-ai-statistics";
import {
  CONTACT_AI_CONTEXT_SCHEMA_VERSION,
  resolveBuildContactAiContextOptions,
  type BuildContactAiContextOptions,
} from "./types/build-options";
import type {
  AnyContactContextProvider,
  ContactContextProviderInput,
  ContactContextProviderOutputs,
  ContactContextProviderResultMap,
} from "./types/contact-context-provider";
import type { ContactAiContext, ContactAiContextMetadata } from "./types/contact-ai-context";

export type BuildContactAiContextForTenantInput = ContactContextProviderInput & {
  options?: BuildContactAiContextOptions;
};

function assignProviderOutput<K extends keyof ContactContextProviderResultMap>(
  outputs: ContactContextProviderOutputs,
  key: K,
  result: ContactContextProviderResultMap[K],
): void {
  outputs[key] = result;
}

function buildProviderVersions(
  providers: readonly AnyContactContextProvider[],
): ContactAiContextMetadata["providerVersions"] {
  return Object.fromEntries(
    providers.map((provider) => [provider.key, provider.version]),
  );
}

function assembleContext(input: {
  companyId: string;
  contactId: string;
  outputs: ContactContextProviderOutputs;
  sections: ReadonlySet<import("./types/build-options").ContactAiContextSection>;
  includeMetadata: boolean;
  executedProviders: readonly AnyContactContextProvider[];
}): ContactAiContext {
  const snapshot = createEmptySnapshot();

  if (input.outputs.contact) {
    if (input.sections.has("snapshot")) {
      snapshot.workflow = input.outputs.contact.workflow;
    }
  }

  if (input.outputs.callbacks && input.sections.has("snapshot")) {
    snapshot.callbacks = input.outputs.callbacks.callbacks;
  }

  if (input.outputs.orders && input.sections.has("snapshot")) {
    snapshot.orders = input.outputs.orders.orders;
  }

  if (input.outputs.notes && input.sections.has("snapshot")) {
    snapshot.notes = input.outputs.notes.notes;
  }

  if (input.outputs.products && input.sections.has("snapshot")) {
    snapshot.products = input.outputs.products.products;
  }

  const contact =
    input.sections.has("contact") && input.outputs.contact
      ? input.outputs.contact.contact
      : createEmptyContactAiProfile(input.contactId);

  const history =
    input.sections.has("history") && input.outputs.activity
      ? { activities: input.outputs.activity.activities }
      : EMPTY_HISTORY;

  const statistics = input.sections.has("statistics")
    ? createContactAiStatistics(input.outputs)
    : EMPTY_STATISTICS;

  const context: ContactAiContext = {
    schemaVersion: CONTACT_AI_CONTEXT_SCHEMA_VERSION,
    contactId: input.contactId,
    companyId: input.companyId,
    contact,
    snapshot,
    history,
    statistics,
  };

  if (input.includeMetadata) {
    const metadata: ContactAiContextMetadata = {
      generatedAt: new Date().toISOString(),
      generatedFromActivityId: input.outputs.activity?.activities[0]?.id ?? null,
      providerVersions: buildProviderVersions(input.executedProviders),
    };

    return freezeContactAiContext({
      ...context,
      metadata,
    });
  }

  return freezeContactAiContext(context);
}

export async function buildContactAiContextForTenant(
  input: BuildContactAiContextForTenantInput,
): Promise<ContactAiContext> {
  const resolvedOptions = resolveBuildContactAiContextOptions(input.options);
  const providers = resolveProvidersForSections(resolvedOptions.sections);

  if (providers.length === 0) {
    return assembleContext({
      companyId: input.companyId,
      contactId: input.contactId,
      outputs: {},
      sections: resolvedOptions.sections,
      includeMetadata: resolvedOptions.includeMetadata,
      executedProviders: [],
    });
  }

  const outputs: ContactContextProviderOutputs = {};

  await Promise.all(
    providers.map(async (provider) => {
      const result = await provider.provide(
        {
          companyId: input.companyId,
          contactId: input.contactId,
        },
        resolvedOptions,
      );

      assignProviderOutput(
        outputs,
        provider.key,
        result as ContactContextProviderResultMap[typeof provider.key],
      );
    }),
  );

  return assembleContext({
    companyId: input.companyId,
    contactId: input.contactId,
    outputs,
    sections: resolvedOptions.sections,
    includeMetadata: resolvedOptions.includeMetadata,
    executedProviders: providers,
  });
}
