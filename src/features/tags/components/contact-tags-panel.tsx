"use client";

import { useActionState } from "react";

import {
  assignContactTagAction,
  createContactTagAction,
  removeContactTagAction,
} from "@/src/features/tags/actions";
import type { ContactTagsPanelView } from "@/src/features/tags/types";

type ContactTagsPanelProps = {
  view: ContactTagsPanelView;
};

const initialActionState = null;

export function ContactTagsPanel({ view }: ContactTagsPanelProps) {
  const [, assignTag] = useActionState(assignContactTagAction, initialActionState);
  const [, createTag] = useActionState(createContactTagAction, initialActionState);
  const [, removeTag] = useActionState(removeContactTagAction, initialActionState);

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white px-4 py-4"
      data-testid="contact-tags-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Tagy</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Segmentace kontaktu pro kampaně a filtrování seznamu.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" data-testid="contact-tags-list">
        {view.tags.length === 0 ? (
          <p className="text-sm text-zinc-500">Kontakt nemá žádné tagy.</p>
        ) : (
          view.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-900"
              data-testid={`contact-tag-${tag.id}`}
            >
              {tag.name}
              {view.canManageTags ? (
                <form action={removeTag}>
                  <input type="hidden" name="contactId" value={view.contactId} />
                  <input type="hidden" name="tagId" value={tag.id} />
                  <button
                    type="submit"
                    className="ml-1 rounded-full px-1 text-violet-700 hover:bg-violet-200"
                    aria-label={`Odebrat tag ${tag.name}`}
                    data-testid={`contact-tag-remove-${tag.id}`}
                  >
                    ×
                  </button>
                </form>
              ) : null}
            </span>
          ))
        )}
      </div>

      {view.canManageTags ? (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {view.availableTags.length > 0 ? (
            <form action={assignTag} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="contactId" value={view.contactId} />
              <label className="flex flex-col gap-1 text-xs text-zinc-600">
                Přidat existující tag
                <select
                  name="tagId"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                  data-testid="contact-tag-assign-select"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Vyberte tag
                  </option>
                  {view.availableTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-800"
                data-testid="contact-tag-assign-submit"
              >
                Přidat
              </button>
            </form>
          ) : null}

          <form action={createTag} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="contactId" value={view.contactId} />
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              Nový tag
              <input
                name="name"
                type="text"
                required
                maxLength={64}
                placeholder="např. Jaro 2026"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                data-testid="contact-tag-create-input"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
              data-testid="contact-tag-create-submit"
            >
              Vytvořit a přidat
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
