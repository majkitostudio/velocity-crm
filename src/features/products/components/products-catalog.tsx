"use client";

import { useActionState, useMemo, useState } from "react";

import type { ActionResult } from "@/src/domain/action-result";
import {
  createProductAction,
  createProductCategoryAction,
  setProductActiveAction,
  setProductCategoryActiveAction,
  updateProductAction,
  updateProductCategoryAction,
} from "@/src/features/products/actions";
import type {
  ProductCatalogItem,
  ProductCatalogView,
  ProductCategoryView,
} from "@/src/features/products/types";

type ProductsCatalogProps = {
  view: ProductCatalogView;
};

type MutationResult = { id: string };

const initialState: ActionResult<MutationResult> | null = null;

function formatPriceCzk(price: string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return `${price} Kč`;
  }

  return `${numericPrice.toFixed(2)} Kč`;
}

function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {isActive ? "Aktivní" : "Neaktivní"}
    </span>
  );
}

function CategoryStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive ? "bg-sky-50 text-sky-800" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {isActive ? "Aktivní" : "Neaktivní"}
    </span>
  );
}

function ActionMessage({ state }: { state: ActionResult<MutationResult> | null }) {
  if (!state) {
    return null;
  }

  if (state.ok) {
    return <p className="text-sm text-emerald-700">Uloženo.</p>;
  }

  return <p className="text-sm text-red-700">{state.error}</p>;
}

function FieldError({
  state,
  field,
}: {
  state: ActionResult<MutationResult> | null;
  field: string;
}) {
  if (!state || state.ok || !state.fieldErrors?.[field]?.[0]) {
    return null;
  }

  return <p className="text-xs text-red-700">{state.fieldErrors[field][0]}</p>;
}

function CategoryCreateForm() {
  const [state, formAction, isPending] = useActionState(
    createProductCategoryAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Nová kategorie</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Kategorie slouží pouze pro organizaci katalogu.
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">Název</span>
        <input
          name="name"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
          placeholder="Např. Doplňky stravy"
        />
        <FieldError state={state} field="name" />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Ukládám…" : "Přidat kategorii"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function ProductCreateForm({ categories }: { categories: ProductCategoryView[] }) {
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Nový produkt</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Cena se ve Slice 5 ukládá jako katalogová cena v Kč.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Název</span>
          <input
            name="name"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
            placeholder="Např. Omega 3"
          />
          <FieldError state={state} field="name" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Cena</span>
          <input
            name="price"
            inputMode="decimal"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
            placeholder="499.00"
          />
          <FieldError state={state} field="price" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">Kategorie</span>
        <select
          name="categoryId"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
          defaultValue=""
        >
          <option value="">Bez kategorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.isActive ? "" : " (neaktivní)"}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Ukládám…" : "Přidat produkt"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function CategoryRow({ category }: { category: ProductCategoryView }) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProductCategoryAction,
    initialState,
  );
  const [activeState, activeAction, isChangingActive] = useActionState(
    setProductCategoryActiveAction,
    initialState,
  );

  return (
    <div
      className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
      data-testid="product-category-row"
      data-category-id={category.id}
    >
      <form action={updateAction} className="space-y-2">
        <input type="hidden" name="categoryId" value={category.id} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Kategorie
          </span>
          <input
            name="name"
            defaultValue={category.name}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
          />
          <FieldError state={updateState} field="name" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryStatusBadge isActive={category.isActive} />
          <span className="text-xs text-zinc-500">{category.productCount} produktů</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Ukládám…" : "Uložit"}
          </button>
        </div>
        <ActionMessage state={updateState} />
      </form>
      <form action={activeAction}>
        <input type="hidden" name="categoryId" value={category.id} />
        <input type="hidden" name="isActive" value={category.isActive ? "false" : "true"} />
        <button
          type="submit"
          disabled={isChangingActive}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChangingActive
            ? "Ukládám…"
            : category.isActive
              ? "Deaktivovat"
              : "Aktivovat"}
        </button>
        <ActionMessage state={activeState} />
      </form>
    </div>
  );
}

function ProductRow({
  product,
  categories,
  canManage,
}: {
  product: ProductCatalogItem;
  categories: ProductCategoryView[];
  canManage: boolean;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProductAction,
    initialState,
  );
  const [activeState, activeAction, isChangingActive] = useActionState(
    setProductActiveAction,
    initialState,
  );

  if (!canManage) {
    return (
      <article
        className="rounded-xl border border-zinc-200 bg-white p-4"
        data-testid="product-row"
        data-product-id={product.id}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-zinc-900">{product.name}</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {product.categoryName ?? "Bez kategorie"}
            </p>
          </div>
          <ProductStatusBadge isActive={product.isActive} />
        </div>
        <p className="mt-4 text-lg font-semibold text-emerald-800">
          {formatPriceCzk(product.price)}
        </p>
      </article>
    );
  }

  return (
    <article
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
      data-testid="product-row"
      data-product-id={product.id}
    >
      <form action={updateAction} className="space-y-3">
        <input type="hidden" name="productId" value={product.id} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ProductStatusBadge isActive={product.isActive} />
          {product.categoryIsActive === false ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              Kategorie je neaktivní
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Název</span>
            <input
              name="name"
              defaultValue={product.name}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
            />
            <FieldError state={updateState} field="name" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Cena</span>
            <input
              name="price"
              inputMode="decimal"
              defaultValue={product.price}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
            />
            <FieldError state={updateState} field="price" />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Kategorie</span>
          <select
            name="categoryId"
            defaultValue={product.categoryId ?? ""}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
          >
            <option value="">Bez kategorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? "" : " (neaktivní)"}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Ukládám…" : "Uložit"}
          </button>
          <span className="self-center text-sm font-semibold text-emerald-800">
            {formatPriceCzk(product.price)}
          </span>
        </div>
        <ActionMessage state={updateState} />
      </form>
      <form action={activeAction}>
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="isActive" value={product.isActive ? "false" : "true"} />
        <button
          type="submit"
          disabled={isChangingActive}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChangingActive
            ? "Ukládám…"
            : product.isActive
              ? "Deaktivovat"
              : "Aktivovat"}
        </button>
        <ActionMessage state={activeState} />
      </form>
    </article>
  );
}

export function ProductsCatalog({ view }: ProductsCatalogProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categoryFilters = useMemo(() => {
    const categoryIdsWithProducts = new Set(
      view.products
        .map((product) => product.categoryId)
        .filter((categoryId): categoryId is string => Boolean(categoryId)),
    );

    return view.categories.filter((category) => categoryIdsWithProducts.has(category.id));
  }, [view.categories, view.products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return view.products.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "none" && product.categoryId === null) ||
        product.categoryId === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, query, view.products]);

  const uncategorizedCount = view.products.filter(
    (product) => product.categoryId === null,
  ).length;

  return (
    <div className="space-y-6" data-testid="products-catalog">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Produkty</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {view.canManage
              ? "Správa produktového katalogu pro objednávky."
              : "Aktivní produktový katalog dostupný pro operátory."}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">{view.products.length} produktů</p>
          <p className="mt-1 text-emerald-800">
            {view.canManage ? "Včetně neaktivních položek" : "Pouze aktivní produkty"}
          </p>
        </div>
      </div>

      {view.canManage ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <CategoryCreateForm />
          <ProductCreateForm categories={view.categories} />
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4" data-testid="products-filter">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Hledat produkt</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-600 focus:ring-2"
              placeholder="Zadejte název produktu"
            />
          </label>
          <div>
            <span className="text-sm font-medium text-zinc-700">Filtr kategorie</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  categoryFilter === "all"
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Vše
              </button>
              {uncategorizedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setCategoryFilter("none")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    categoryFilter === "none"
                      ? "bg-emerald-700 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  Bez kategorie
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {categoryFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {categoryFilters.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  categoryFilter === category.id
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {view.canManage ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Kategorie</h2>
            <p className="text-sm text-zinc-600">
              Deaktivace kategorie nemění dostupnost produktů.
            </p>
          </div>
          {view.categories.length === 0 ? (
            <EmptyCatalogState
              title="Zatím nejsou vytvořené žádné kategorie"
              description="Přidejte první kategorii, aby byl katalog přehlednější."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {view.categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Katalog produktů</h2>
          <p className="text-sm text-zinc-600">
            Produkty jsou dostupné podle vlastního stavu Aktivní / Neaktivní.
          </p>
        </div>
        {view.products.length === 0 ? (
          <EmptyCatalogState
            title="Katalog je prázdný"
            description={
              view.canManage
                ? "Vytvořte první produkt, aby ho bylo možné použít v objednávkách."
                : "Jakmile manager přidá aktivní produkty, zobrazí se zde."
            }
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyCatalogState
            title="Žádný produkt neodpovídá filtru"
            description="Zkuste změnit hledaný výraz nebo filtr kategorie."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                categories={view.categories}
                canManage={view.canManage}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyCatalogState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-600">{description}</p>
    </div>
  );
}
