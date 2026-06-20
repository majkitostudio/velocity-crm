"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { buildContactsListPath } from "@/src/features/contacts/lib/list-navigation";

type ContactsSearchInputProps = {
  initialQuery: string;
  listParams: Record<string, string | number | undefined | null>;
};

const SEARCH_DEBOUNCE_MS = 400;

export function ContactsSearchInput({
  initialQuery,
  listParams,
}: ContactsSearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function navigateWithQuery(nextQuery: string) {
    router.push(
      buildContactsListPath({
        ...listParams,
        page: undefined,
        q: nextQuery.trim() || undefined,
      }),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    navigateWithQuery(value);
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      navigateWithQuery(nextValue);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleClear() {
    setValue("");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    navigateWithQuery("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      data-testid="contacts-search-form"
    >
      <label className="sr-only" htmlFor="contacts-search-input">
        Hledat kontakty
      </label>
      <div className="relative min-w-0 flex-1">
        <input
          id="contacts-search-input"
          type="search"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Jméno, telefon nebo e-mail…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:border-emerald-500 focus:ring-2"
          data-testid="contacts-search-input"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-sm text-zinc-500 hover:text-zinc-800"
            aria-label="Vymazat hledání"
            data-testid="contacts-search-clear"
          >
            ×
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
        data-testid="contacts-search-submit"
      >
        Hledat
      </button>
    </form>
  );
}
