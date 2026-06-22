import {
  createEmptyContactProfile,
  createEmptySnapshot,
  EMPTY_HISTORY,
  EMPTY_STATISTICS,
  freezeContactContext,
} from "./lib/contact-context-defaults";
import {
  hasLoadedSection,
  resolveProvidersForSections,
} from "./providers/provider-registry";
import { createContactStatistics } from "./statistics/create-contact-statistics";
import {
  CONTACT_CONTEXT_SCHEMA_VERSION,
  resolveBuildContactContextOptions,
  type BuildContactContextOptions,
} from "./types/build-options";
import type {
  AnyContactContextProvider,
  ContactContextProviderInput,
  ContactContextProviderOutputs,
  ContactContextProviderResultMap,
} from "./types/contact-context-provider";
import type { ContactContext, ContactContextMetadata } from "./types/contact-context";

export type BuildContactContextForTenantInput = ContactContextProviderInput & {
  options?: BuildContactContextOptions;
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
): ContactContextMetadata["providerVersions"] {
  return Object.fromEntries(
    providers.map((provider) => [provider.key, provider.version]),
  );
}

function assembleContext(input: {
  companyId: string;
  contactId: string;
  outputs: ContactContextProviderOutputs;
  sections: ReadonlySet<import("./types/build-options").ContactContextSection>;
  includeMetadata: boolean;
  executedProviders: readonly AnyContactContextProvider[];
}): ContactContext {
  const snapshot = createEmptySnapshot();

  if (input.outputs.contact && hasLoadedSection(input.sections, "snapshot.workflow")) {
    snapshot.workflow = input.outputs.contact.workflow;
  }

  if (input.outputs.callbacks && hasLoadedSection(input.sections, "snapshot.callbacks")) {
    snapshot.callbacks = input.outputs.callbacks.callbacks;
  }

  if (input.outputs.orders && hasLoadedSection(input.sections, "snapshot.orders")) {
    snapshot.orders = input.outputs.orders.orders;
  }

  if (input.outputs.notes && hasLoadedSection(input.sections, "snapshot.notes")) {
    snapshot.notes = input.outputs.notes.notes;
  }

  if (input.outputs.products && hasLoadedSection(input.sections, "snapshot.products")) {
    snapshot.products = input.outputs.products.products;
  }

  const contact =
    hasLoadedSection(input.sections, "contact") && input.outputs.contact
      ? input.outputs.contact.contact
      : createEmptyContactProfile(input.contactId);

  const history =
    hasLoadedSection(input.sections, "history") && input.outputs.activity
      ? { activities: input.outputs.activity.activities }
      : EMPTY_HISTORY;

  const statistics = hasLoadedSection(input.sections, "statistics")
    ? createContactStatistics(input.outputs)
    : EMPTY_STATISTICS;

  const context: ContactContext = {
    schemaVersion: CONTACT_CONTEXT_SCHEMA_VERSION,
    contactId: input.contactId,
    companyId: input.companyId,
    contact,
    snapshot,
    history,
    statistics,
  };

  if (input.includeMetadata) {
    const metadata: ContactContextMetadata = {
      generatedAt: new Date().toISOString(),
      generatedFromActivityId: input.outputs.activity?.activities[0]?.id ?? null,
      providerVersions: buildProviderVersions(input.executedProviders),
    };

    return freezeContactContext({
      ...context,
      metadata,
    });
  }

  return freezeContactContext(context);
}

export async function buildContactContextForTenant(
  input: BuildContactContextForTenantInput,
): Promise<ContactContext> {
  const resolvedOptions = resolveBuildContactContextOptions(input.options);
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
