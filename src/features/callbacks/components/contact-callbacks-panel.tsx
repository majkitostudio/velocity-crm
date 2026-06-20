import type { ContactCallbacksPanelView } from "../types";
import { CallbackForm } from "./callback-form";
import { ContactCallbackRow } from "./contact-callback-row";

type ContactCallbacksPanelProps = {
  view: ContactCallbacksPanelView;
};

export function ContactCallbacksPanel({ view }: ContactCallbacksPanelProps) {
  return (
    <section
      id="callbacky"
      className="rounded-xl border border-zinc-200 bg-white p-4"
      data-testid="contact-callbacks-panel"
    >
      <h2 className="text-sm font-semibold text-zinc-900">Callbacky</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Naplánujte nebo spravujte callbacky pro tento kontakt.
      </p>

      <div className="mt-4 space-y-3">
        {view.openCallbacks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600">
            Žádné otevřené callbacky.
          </p>
        ) : (
          view.openCallbacks.map((callback) => (
            <ContactCallbackRow
              key={callback.id}
              callback={callback}
              highlighted={view.highlightedCallbackId === callback.id}
            />
          ))
        )}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-4">
        <h3 className="text-sm font-medium text-zinc-800">Naplánovat callback</h3>
        <div className="mt-3">
          <CallbackForm
            contactId={view.contactId}
            canAssignToOthers={view.canAssignToOthers}
            assignableOperators={view.assignableOperators}
            disabled={view.hasExistingOpenCallback}
            disabledMessage={
              view.hasExistingOpenCallback
                ? "Kontakt už má otevřený callback. Nejdříve ho přeplánujte nebo zrušte."
                : null
            }
          />
        </div>
      </div>
    </section>
  );
}
