"use client";

type PhoneActionsProps = {
  phone: string;
};

export function PhoneActions({ phone }: PhoneActionsProps) {
  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
    } catch {
      // Clipboard may be unavailable in unsupported contexts.
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          void copyPhone();
        }}
        className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-100"
        data-testid="copy-phone-button"
      >
        Kopírovat
      </button>
    </div>
  );
}
