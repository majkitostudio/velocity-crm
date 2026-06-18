import type { ContactNoteView } from "../types";
import { formatDateTime } from "../lib/labels";

import { ContactNoteForm } from "./contact-note-form";

type ContactNotesSectionProps = {
  contactId: string;
  notes: ContactNoteView[];
};

export function ContactNotesSection({ contactId, notes }: ContactNotesSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Notes</h2>
        <p className="text-sm text-zinc-600">
          Working notes for this contact. The same notes also appear in the activity
          timeline.
        </p>
      </div>

      <ContactNoteForm contactId={contactId} />

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-600">No notes yet.</p>
      ) : (
        <ul className="space-y-3" data-testid="notes-list">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <time dateTime={note.createdAt.toISOString()}>
                  {formatDateTime(note.createdAt)}
                </time>
                {note.authorName ? <span>· {note.authorName}</span> : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
