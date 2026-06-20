"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { ActionResult } from "@/src/domain/action-result";
import { CALL_LATER_DELAY_HOURS } from "@/src/domain/workflow";
import { completeCallAction } from "@/src/features/calls/actions";
import { CallOutcomeValue } from "@/src/features/calls/constants";
import { useCallWorkflowState } from "@/src/features/calls/hooks/use-call-workflow-state";
import { useNavigationGuard } from "@/src/features/calls/hooks/use-navigation-guard";
import type { CompleteCallResult } from "@/src/features/calls/types";
import { formatDateTime } from "@/src/features/calls/lib/format-datetime";
import { getOrderProductCatalogAction } from "@/src/features/products/actions";
import type { OrderProductCatalogItem } from "@/src/features/products/types";

type CallWorkflowPanelProps = {
  contactId: string;
  sourceCallbackId: string | null;
  sourceCallbackScheduledAt: Date | string | null;
  sourceCallbackNote: string | null;
  failCount: number;
  failThreshold: number;
  /** Defaults to operator dashboard queue. */
  returnToQueueHref?: string;
  /** Reserved for a future slice — when set, shows a second navigation action. */
  nextContactHref?: string | null;
};

const initialState: ActionResult<CompleteCallResult> | null = null;

const outcomeOptions = [
  {
    value: CallOutcomeValue.ORDER,
    label: "Order",
    disabled: false,
    hint: null,
  },
  {
    value: CallOutcomeValue.CALL_LATER,
    label: "Call later",
    disabled: false,
    hint: null,
  },
  {
    value: CallOutcomeValue.SCHEDULE_CALL,
    label: "Schedule call",
    disabled: false,
    hint: null,
  },
  {
    value: CallOutcomeValue.FAIL,
    label: "Fail",
    disabled: false,
    hint: null,
  },
] as const;

function toDate(value: Date | string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type OrderFormRow = {
  rowId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
};

function parsePrice(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} Kč`;
}

function buildOrderRow(product: OrderProductCatalogItem): OrderFormRow {
  return {
    rowId: crypto.randomUUID(),
    productId: product.id,
    quantity: 1,
    unitPrice: product.price,
  };
}

export function CallWorkflowPanel({
  contactId,
  sourceCallbackId,
  sourceCallbackScheduledAt,
  sourceCallbackNote,
  failCount,
  failThreshold,
  returnToQueueHref = "/dashboard",
  nextContactHref = null,
}: CallWorkflowPanelProps) {
  const {
    phase,
    selectedOutcome,
    idempotencyKey,
    startCall,
    endCall,
    selectOutcome,
    reset,
  } = useCallWorkflowState();
  const [state, formAction, isPending] = useActionState(completeCallAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [orderProducts, setOrderProducts] = useState<OrderProductCatalogItem[]>([]);
  const [orderRows, setOrderRows] = useState<OrderFormRow[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [orderCatalogError, setOrderCatalogError] = useState<string | null>(null);

  useNavigationGuard(phase);

  useEffect(() => {
    if (state?.ok) {
      reset();
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, reset, router]);

  const nextFailCount = failCount + 1;
  const willBecomeLost =
    selectedOutcome === CallOutcomeValue.FAIL && nextFailCount >= failThreshold;

  const sourceCallbackDate = toDate(sourceCallbackScheduledAt);

  const selectedProductIds = useMemo(
    () => new Set(orderRows.map((row) => row.productId).filter(Boolean)),
    [orderRows],
  );

  const orderTotal = useMemo(
    () =>
      orderRows.reduce(
        (total, row) => total + parsePrice(row.unitPrice) * row.quantity,
        0,
      ),
    [orderRows],
  );

  const serializedOrderItems = useMemo(
    () =>
      JSON.stringify(
        orderRows.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
        })),
      ),
    [orderRows],
  );

  async function ensureOrderCatalogLoaded() {
    if (orderProducts.length > 0) {
      if (orderRows.length === 0 && orderProducts[0]) {
        setOrderRows([buildOrderRow(orderProducts[0])]);
      }

      return;
    }

    if (isLoadingProducts) {
      return;
    }

    setIsLoadingProducts(true);
    setOrderCatalogError(null);

    const result = await getOrderProductCatalogAction();

    if (result.ok) {
      setOrderProducts(result.data);
      setOrderRows(result.data[0] ? [buildOrderRow(result.data[0])] : []);
    } else {
      setOrderCatalogError(result.error);
    }

    setIsLoadingProducts(false);
  }

  function handleSelectOutcome(outcome: CallOutcomeValue) {
    selectOutcome(outcome);

    if (outcome === CallOutcomeValue.ORDER) {
      void ensureOrderCatalogLoaded();
    }
  }

  function updateOrderRow(rowId: string, patch: Partial<OrderFormRow>) {
    setOrderRows((rows) =>
      rows.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
    );
  }

  function changeOrderProduct(rowId: string, productId: string) {
    const product = orderProducts.find((item) => item.id === productId);

    updateOrderRow(rowId, {
      productId,
      unitPrice: product?.price ?? "0.00",
    });
  }

  function addOrderRow() {
    const nextProduct = orderProducts.find((product) => !selectedProductIds.has(product.id));

    if (!nextProduct) {
      return;
    }

    setOrderRows((rows) => [...rows, buildOrderRow(nextProduct)]);
  }

  function removeOrderRow(rowId: string) {
    setOrderRows((rows) => rows.filter((row) => row.rowId !== rowId));
  }

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4"
      data-testid="call-workflow-panel"
    >
      <h2 className="text-sm font-semibold text-zinc-900">Call workflow</h2>

      {sourceCallbackId && sourceCallbackDate ? (
        <div
          className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900"
          data-testid="source-callback-context"
        >
          <p className="font-medium">Due callback</p>
          <p className="mt-1 text-sky-800">{formatDateTime(sourceCallbackDate)}</p>
          {sourceCallbackNote ? (
            <p className="mt-1 text-sky-700">{sourceCallbackNote}</p>
          ) : null}
        </div>
      ) : null}

      {phase === "idle" ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setOrderRows([]);
              startCall();
            }}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
            data-testid="start-call-button"
          >
            Start call
          </button>
        </div>
      ) : null}

      {phase === "active" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-zinc-600">Call in progress</p>
          <button
            type="button"
            onClick={endCall}
            className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            data-testid="end-call-button"
          >
            End call
          </button>
        </div>
      ) : null}

      {phase === "disposition" ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium text-amber-800">Select call outcome</p>

          <div className="grid grid-cols-2 gap-2">
            {outcomeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (
                    option.value === CallOutcomeValue.ORDER ||
                    option.value === CallOutcomeValue.CALL_LATER ||
                    option.value === CallOutcomeValue.SCHEDULE_CALL ||
                    option.value === CallOutcomeValue.FAIL
                  ) {
                    handleSelectOutcome(option.value);
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  option.disabled
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
                    : selectedOutcome === option.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-300"
                }`}
                title={option.disabled ? option.hint ?? undefined : undefined}
                data-testid={`outcome-${option.value.toLowerCase()}-button`}
              >
                {option.label}
                {option.disabled && option.hint ? (
                  <span className="mt-0.5 block text-xs font-normal">{option.hint}</span>
                ) : null}
              </button>
            ))}
          </div>

          {selectedOutcome === CallOutcomeValue.ORDER ? (
            <form
              ref={formRef}
              action={formAction}
              className="space-y-4"
              data-testid="order-form"
            >
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.ORDER} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              <input type="hidden" name="orderItems" value={serializedOrderItems} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}

              {isLoadingProducts ? (
                <p
                  className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
                  data-testid="order-catalog-loading"
                >
                  Načítám produktový katalog…
                </p>
              ) : null}

              {orderCatalogError ? (
                <p
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  data-testid="order-catalog-error"
                >
                  {orderCatalogError}
                </p>
              ) : null}

              {!isLoadingProducts && orderProducts.length === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  V aktivním katalogu nejsou žádné produkty.
                </p>
              ) : null}

              {orderRows.map((row, index) => {
                const lineTotal = parsePrice(row.unitPrice) * row.quantity;

                return (
                  <div
                    key={row.rowId}
                    className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                    data-testid="order-item-row"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-800">
                        Položka {index + 1}
                      </p>
                      {orderRows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeOrderRow(row.rowId)}
                          className="text-sm font-medium text-red-700 hover:text-red-800"
                        >
                          Odebrat
                        </button>
                      ) : null}
                    </div>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-zinc-700">Produkt</span>
                      <select
                        value={row.productId}
                        onChange={(event) =>
                          changeOrderProduct(row.rowId, event.target.value)
                        }
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                        data-testid="order-product-select"
                      >
                        {orderProducts.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                            disabled={
                              product.id !== row.productId &&
                              selectedProductIds.has(product.id)
                            }
                          >
                            {product.name}
                            {product.categoryName ? ` (${product.categoryName})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-zinc-700">Množství</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={row.quantity}
                          onChange={(event) =>
                            updateOrderRow(row.rowId, {
                              quantity: Math.max(1, Number(event.target.value) || 1),
                            })
                          }
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                          data-testid="order-quantity-input"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-zinc-700">
                          Jednotková cena
                        </span>
                        <input
                          inputMode="decimal"
                          value={row.unitPrice}
                          onChange={(event) =>
                            updateOrderRow(row.rowId, {
                              unitPrice: event.target.value,
                            })
                          }
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                          data-testid="order-unit-price-input"
                        />
                      </label>
                    </div>

                    <p className="text-sm font-medium text-zinc-700">
                      Mezisoučet: {formatPrice(lineTotal)}
                    </p>
                  </div>
                );
              })}

              {state?.ok === false && state.fieldErrors?.orderItems ? (
                <p className="text-sm text-red-600">{state.fieldErrors.orderItems[0]}</p>
              ) : null}

              <button
                type="button"
                onClick={addOrderRow}
                disabled={orderRows.length >= orderProducts.length}
                className="w-full rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="order-add-product-button"
              >
                Přidat produkt
              </button>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  Poznámka k objednávce
                </span>
                <textarea
                  name="orderNote"
                  rows={3}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                  placeholder="Interní poznámka, individuální cena nebo přání zákazníka…"
                  data-testid="order-note-input"
                />
              </label>

              <div
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                data-testid="order-summary"
              >
                <p className="font-medium">Souhrn objednávky</p>
                <p className="mt-1">
                  {orderRows.length} položek, celkem {formatPrice(orderTotal)}
                </p>
              </div>

              <SubmitSection
                isPending={isPending || isLoadingProducts || orderProducts.length === 0}
              />
            </form>
          ) : null}

          {selectedOutcome === CallOutcomeValue.CALL_LATER ? (
            <p className="text-sm text-zinc-600">
              Callback bude vytvořen za {CALL_LATER_DELAY_HOURS} hodiny.
            </p>
          ) : null}

          {selectedOutcome === CallOutcomeValue.SCHEDULE_CALL ? (
            <form ref={formRef} action={formAction} className="space-y-3">
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.SCHEDULE_CALL} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Date and time</span>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  required
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                />
              </label>
              {state?.ok === false && state.fieldErrors?.scheduledAt ? (
                <p className="text-sm text-red-600">{state.fieldErrors.scheduledAt[0]}</p>
              ) : null}
              <SubmitSection isPending={isPending} />
            </form>
          ) : null}

          {selectedOutcome === CallOutcomeValue.FAIL ? (
            <form ref={formRef} action={formAction} className="space-y-3">
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.FAIL} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}
              <p className="text-sm text-zinc-600">
                Failed attempts: {failCount} / {failThreshold}
                {willBecomeLost ? (
                  <span className="mt-1 block font-medium text-red-700">
                    This attempt will mark the contact as Lost.
                  </span>
                ) : null}
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Note</span>
                <textarea
                  name="note"
                  rows={3}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
                  placeholder="Optional note about this call…"
                />
              </label>
              <SubmitSection isPending={isPending} />
            </form>
          ) : null}

          {selectedOutcome === CallOutcomeValue.CALL_LATER ? (
            <form ref={formRef} action={formAction} className="space-y-3">
              <input type="hidden" name="contactId" value={contactId} />
              <input type="hidden" name="outcome" value={CallOutcomeValue.CALL_LATER} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey ?? ""} />
              {sourceCallbackId ? (
                <input type="hidden" name="sourceCallbackId" value={sourceCallbackId} />
              ) : null}
              <SubmitSection isPending={isPending} />
            </form>
          ) : null}
        </div>
      ) : null}

      {state?.ok === false && state.error && phase === "disposition" ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      {state?.ok ? (
        <div className="mt-3 space-y-3">
          <p
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            data-testid="call-success-message"
          >
            {state.data.outcome === CallOutcomeValue.ORDER && state.data.orderId
              ? `Objednávka vytvořena: ${state.data.orderItemCount ?? 0} položek, celkem ${formatPrice(parsePrice(state.data.orderTotal ?? "0"))}.`
              : "Call completed."}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={returnToQueueHref}
              className="inline-flex justify-center rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
              data-testid="back-to-queue-link"
            >
              Back to queue
            </Link>
            {nextContactHref ? (
              <Link
                href={nextContactHref}
                className="inline-flex justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                data-testid="next-contact-link"
              >
                Next contact
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type SubmitSectionProps = {
  isPending: boolean;
};

function SubmitSection({ isPending }: SubmitSectionProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      data-testid="confirm-call-button"
    >
      {isPending ? "Saving…" : "Confirm"}
    </button>
  );
}
