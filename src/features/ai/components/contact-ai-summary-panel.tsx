"use client";

import { useRef, useState, useTransition } from "react";

import { generateContactSummaryAction } from "../actions/generate-contact-summary.action";
import type { SummaryViewModel } from "../types/summary-view-model";

import { ContactAiSummarySourceBadge } from "./contact-ai-summary-source-badge";
import { resolveContactAiSummaryPanelPhase } from "./contact-ai-summary-panel.types";

type ContactAiSummaryPanelProps = {
  contactId: string;
};

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatConfidence(value: number): string {
  return `${Math.round(value * 100)} %`;
}

export function ContactAiSummaryPanel({ contactId }: ContactAiSummaryPanelProps) {
  const [viewModel, setViewModel] = useState<SummaryViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inFlightRef = useRef(false);

  const phase = resolveContactAiSummaryPanelPhase({
    viewModel,
    isPending,
    errorMessage,
  });

  const handleGenerate = () => {
    if (inFlightRef.current || isPending) {
      return;
    }

    inFlightRef.current = true;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await generateContactSummaryAction(contactId);

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        setViewModel(result.data);
      } finally {
        inFlightRef.current = false;
      }
    });
  };

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4"
      data-testid="contact-ai-summary-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">AI shrnutí</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Stručné shrnutí kontaktu pro rychlou orientaci operátora.
          </p>
        </div>
        {viewModel ? <ContactAiSummarySourceBadge source={viewModel.source} /> : null}
      </div>

      {phase === "empty" ? (
        <div className="mt-4 space-y-3" data-testid="contact-ai-summary-empty">
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600">
            Shrnutí zatím nebylo vygenerováno.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="contact-ai-summary-generate-button"
            disabled={isPending}
            onClick={handleGenerate}
          >
            Vygenerovat shrnutí
          </button>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className="mt-4 space-y-3" data-testid="contact-ai-summary-loading">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
              aria-hidden="true"
            />
            <span>Generuji shrnutí…</span>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white opacity-60"
            data-testid="contact-ai-summary-generate-button"
            disabled
          >
            Vygenerovat shrnutí
          </button>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="mt-4 space-y-3" data-testid="contact-ai-summary-error">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="contact-ai-summary-generate-button"
            disabled={isPending}
            onClick={handleGenerate}
          >
            Vygenerovat shrnutí
          </button>
        </div>
      ) : null}

      {phase === "success" && viewModel ? (
        <div className="mt-4 space-y-4" data-testid="contact-ai-summary-success">
          <p className="text-sm leading-6 text-zinc-800" data-testid="contact-ai-summary-text">
            {viewModel.summary}
          </p>

          {viewModel.recommendations.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Doporučení
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {viewModel.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {viewModel.warnings.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Upozornění
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {viewModel.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span data-testid="contact-ai-summary-confidence">
              Spolehlivost: {formatConfidence(viewModel.confidence)}
            </span>
            <span>{formatGeneratedAt(viewModel.metadata.generatedAt)}</span>
            <span>{viewModel.metadata.promptLabel}</span>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="contact-ai-summary-generate-button"
            disabled={isPending}
            onClick={handleGenerate}
          >
            Vygenerovat znovu
          </button>
        </div>
      ) : null}
    </section>
  );
}
