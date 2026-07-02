"use client";

import { useRef, useState, useTransition } from "react";

import { generateContactRecommendationAction } from "../actions/generate-contact-recommendation.action";
import type { RecommendationViewModel, RecommendedAction } from "../types/recommendation-view-model";

import { ContactAiRecommendationSourceBadge } from "./contact-ai-recommendation-source-badge";
import {
  isContactAiRecommendationRefreshing,
  resolveContactAiRecommendationPanelPhase,
  shouldShowContactAiRecommendationRefreshButton,
} from "./contact-ai-recommendation-panel.types";

type ContactAiRecommendationPanelProps = {
  contactId: string;
  refreshEnabled: boolean;
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

function formatPriorityLabel(priority: RecommendedAction["priority"]): string {
  switch (priority) {
    case "HIGH":
      return "Vysoká";
    case "MEDIUM":
      return "Střední";
    case "LOW":
      return "Nízká";
    default:
      return priority;
  }
}

function priorityBadgeClass(priority: RecommendedAction["priority"]): string {
  switch (priority) {
    case "HIGH":
      return "border-red-200 bg-red-50 text-red-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "LOW":
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function ActionCard({
  action,
  variant = "primary",
}: {
  action: RecommendedAction;
  variant?: "primary" | "alternative";
}) {
  return (
    <article
      className={
        variant === "primary"
          ? "rounded-lg border border-indigo-200 bg-indigo-50/60 p-3"
          : "rounded-lg border border-indigo-100 bg-white p-3"
      }
      data-testid={
        variant === "primary"
          ? "contact-ai-recommendation-primary-action"
          : "contact-ai-recommendation-alternative-action"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${priorityBadgeClass(action.priority)}`}
          data-testid="contact-ai-recommendation-priority-badge"
        >
          {formatPriorityLabel(action.priority)}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-600">
          {action.actionType}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-zinc-900">{action.title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-700">{action.rationale}</p>
      {action.suggestedContactAt ? (
        <p className="mt-2 text-xs text-indigo-700">
          Navržený čas: {formatGeneratedAt(action.suggestedContactAt)}
        </p>
      ) : null}
    </article>
  );
}

export function ContactAiRecommendationPanel({
  contactId,
  refreshEnabled,
}: ContactAiRecommendationPanelProps) {
  const [viewModel, setViewModel] = useState<RecommendationViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inFlightRef = useRef(false);

  const phase = resolveContactAiRecommendationPanelPhase({
    viewModel,
    isPending,
    errorMessage,
  });

  const isRefreshing = isContactAiRecommendationRefreshing({ viewModel, isPending });

  const showRefreshButton = shouldShowContactAiRecommendationRefreshButton({
    viewModel,
    refreshEnabled,
  });

  const handleSubmit = (force = false) => {
    if (inFlightRef.current || isPending) {
      return;
    }

    inFlightRef.current = true;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result =
          force === true
            ? await generateContactRecommendationAction(contactId, true)
            : await generateContactRecommendationAction(contactId);

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
      className="rounded-xl border border-indigo-200 bg-white p-4"
      data-testid="contact-ai-recommendation-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-indigo-950">AI doporučení</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Konkrétní další krok pro operátora na základě kontextu kontaktu.
          </p>
        </div>
        {viewModel ? <ContactAiRecommendationSourceBadge source={viewModel.source} /> : null}
      </div>

      {phase === "empty" ? (
        <div className="mt-4 space-y-3" data-testid="contact-ai-recommendation-empty">
          <p className="rounded-lg border border-dashed border-indigo-200 px-3 py-2 text-sm text-zinc-600">
            Doporučení zatím nebylo vygenerováno.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="contact-ai-recommendation-generate-button"
            disabled={isPending}
            onClick={() => handleSubmit(false)}
          >
            Generovat doporučení
          </button>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className="mt-4 space-y-3" data-testid="contact-ai-recommendation-loading">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden="true"
            />
            <span>Generuji doporučení…</span>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white opacity-60"
            data-testid="contact-ai-recommendation-generate-button"
            disabled
          >
            Generovat doporučení
          </button>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="mt-4 space-y-3" data-testid="contact-ai-recommendation-error">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="contact-ai-recommendation-generate-button"
            disabled={isPending}
            onClick={() => handleSubmit(false)}
          >
            Generovat doporučení
          </button>
        </div>
      ) : null}

      {phase === "success" && viewModel ? (
        <div className="mt-4 space-y-4" data-testid="contact-ai-recommendation-success">
          <ActionCard action={viewModel.primaryAction} variant="primary" />

          {viewModel.alternatives.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Alternativy
              </h3>
              <div className="mt-2 space-y-2">
                {viewModel.alternatives.map((action) => (
                  <ActionCard
                    key={`${action.actionType}-${action.title}`}
                    action={action}
                    variant="alternative"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {viewModel.risks.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Rizika
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {viewModel.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {viewModel.followUpTasks.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Follow-up úkoly
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {viewModel.followUpTasks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span data-testid="contact-ai-recommendation-confidence">
              Spolehlivost: {formatConfidence(viewModel.confidence)}
            </span>
            <span>{formatGeneratedAt(viewModel.metadata.generatedAt)}</span>
            <span>{viewModel.metadata.promptLabel}</span>
          </div>

          {showRefreshButton ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-800 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="contact-ai-recommendation-refresh-button"
              disabled={isPending}
              onClick={() => handleSubmit(true)}
            >
              {isRefreshing ? (
                <>
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
                    aria-hidden="true"
                    data-testid="contact-ai-recommendation-refresh-spinner"
                  />
                  <span>Obnovuji doporučení…</span>
                </>
              ) : (
                "Obnovit doporučení"
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
