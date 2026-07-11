"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CaretDown, FunnelSimple, X } from "@phosphor-icons/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { LocalizedString } from "@/lib/content";
import { pick } from "@/lib/content";
import { formatIQD } from "@/lib/money";
import {
  FILTER_CATEGORIES as CATEGORIES,
  FILTER_SIZES as SIZES,
  PRICE_RANGES,
} from "@/lib/commerce/filters";

export interface ColorOption {
  key: string;
  hex: string;
  name: LocalizedString;
}

/**
 * URL-driven filter bar: every change is router.replace'd into the query
 * string, so filtered views are shareable, SSR-rendered and survive
 * locale switches. Desktop shows an expandable panel; mobile a sheet.
 */
export default function ShopFilters({ colors }: { colors: ColorOption[] }) {
  const t = useTranslations("shop");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const current = useMemo(
    () => ({
      category: searchParams.get("category") ?? "all",
      gender: searchParams.get("gender") ?? undefined,
      sizes: searchParams.get("sizes")?.split(",").filter(Boolean) ?? [],
      colors: searchParams.get("colors")?.split(",").filter(Boolean) ?? [],
      price: searchParams.get("price") ?? undefined,
      instock: searchParams.get("instock") === "1",
      sale: searchParams.get("sale") === "1",
      isNew: searchParams.get("new") === "1",
      sort: searchParams.get("sort") ?? "featured",
    }),
    [searchParams],
  );

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [searchParams, router, pathname],
  );

  const toggleList = (name: "sizes" | "colors", value: string) =>
    update((p) => {
      const list = p.get(name)?.split(",").filter(Boolean) ?? [];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      if (next.length) p.set(name, next.join(","));
      else p.delete(name);
    });

  const activeCount =
    current.sizes.length +
    current.colors.length +
    (current.price ? 1 : 0) +
    (current.instock ? 1 : 0) +
    (current.category !== "all" ? 1 : 0) +
    (current.gender ? 1 : 0) +
    (current.sale ? 1 : 0) +
    (current.isNew ? 1 : 0);

  function priceLabel(r: (typeof PRICE_RANGES)[number]): string {
    if (r.min !== undefined && r.max !== undefined)
      return t("priceBetween", {
        min: formatIQD(r.min, locale),
        max: formatIQD(r.max, locale),
      });
    if (r.max !== undefined)
      return t("priceUnder", { price: formatIQD(r.max, locale) });
    return t("priceOver", { price: formatIQD(r.min!, locale) });
  }

  return (
    <div className="border-y border-line bg-paper">
      {/* Bar */}
      <div className="container-x flex flex-wrap items-center gap-2 py-3">
        <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1">
          {CATEGORIES.map((c) => {
            const active = current.category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  update((p) => {
                    if (c === "all") p.delete("category");
                    else p.set("category", c);
                  })
                }
                className={`flex min-h-10 shrink-0 cursor-pointer items-center px-4 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "bg-studio text-ink hover:bg-line"
                }`}
              >
                {tCat(c)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="flex min-h-10 cursor-pointer items-center gap-2 border border-line px-4 text-sm font-semibold transition-colors hover:border-ink"
        >
          <FunnelSimple size={16} aria-hidden="true" />
          {t("filters")}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green px-1 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
          <CaretDown
            size={12}
            aria-hidden="true"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <label className="flex items-center gap-2">
          <span className="sr-only">{t("sort")}</span>
          <div className="relative">
            <select
              value={current.sort}
              onChange={(e) =>
                update((p) => {
                  if (e.target.value === "featured") p.delete("sort");
                  else p.set("sort", e.target.value);
                })
              }
              className="min-h-10 cursor-pointer appearance-none border border-line bg-paper pe-9 ps-4 text-sm font-semibold outline-none transition-colors hover:border-ink focus:border-ink"
            >
              <option value="featured">{t("sortFeatured")}</option>
              <option value="newest">{t("sortNewest")}</option>
              <option value="price-asc">{t("sortPriceAsc")}</option>
              <option value="price-desc">{t("sortPriceDesc")}</option>
            </select>
            <CaretDown
              size={12}
              aria-hidden="true"
              className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2"
            />
          </div>
        </label>
      </div>

      {/* Expandable panel */}
      {open && (
        <div id="filter-panel" className="border-t border-line">
          <div className="container-x grid gap-8 py-6 md:grid-cols-4">
            {/* Sizes */}
            <fieldset>
              <legend className="text-eyebrow mb-3 text-ink/60">
                {t("size")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => {
                  const active = current.sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleList("sizes", s)}
                      className={`flex h-11 min-w-11 cursor-pointer items-center justify-center border px-3 text-sm font-semibold transition-colors ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-ink"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Colours */}
            <fieldset>
              <legend className="text-eyebrow mb-3 text-ink/60">
                {t("color")}
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c) => {
                  const active = current.colors.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={active}
                      title={pick(c.name, locale)}
                      aria-label={pick(c.name, locale)}
                      onClick={() => toggleList("colors", c.key)}
                      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 transition-all ${
                        active ? "border-ink" : "border-transparent hover:border-line-strong"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-7 w-7 rounded-full border border-ink/15"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Price */}
            <fieldset>
              <legend className="text-eyebrow mb-3 text-ink/60">
                {t("price")}
              </legend>
              <div className="space-y-1">
                {PRICE_RANGES.map((r) => {
                  const active = current.price === r.id;
                  return (
                    <label
                      key={r.id}
                      className="flex min-h-10 cursor-pointer items-center gap-3 text-sm"
                    >
                      <input
                        type="radio"
                        name="price-range"
                        checked={active}
                        onChange={() =>
                          update((p) => {
                            if (active) p.delete("price");
                            else p.set("price", r.id);
                          })
                        }
                        onClick={() => {
                          if (active) update((p) => p.delete("price"));
                        }}
                        className="h-4 w-4 accent-ink"
                      />
                      <span className="price">{priceLabel(r)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Availability + clear */}
            <div className="flex flex-col justify-between gap-6">
              <fieldset>
                <legend className="text-eyebrow mb-3 text-ink/60">
                  {t("availability")}
                </legend>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={current.instock}
                    onChange={() =>
                      update((p) => {
                        if (current.instock) p.delete("instock");
                        else p.set("instock", "1");
                      })
                    }
                    className="h-4 w-4 accent-ink"
                  />
                  {t("inStockOnly")}
                </label>
              </fieldset>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    update((p) => {
                      [
                        "category",
                        "gender",
                        "sizes",
                        "colors",
                        "price",
                        "instock",
                        "sale",
                        "new",
                      ].forEach((k) => p.delete(k));
                    })
                  }
                  className="flex min-h-10 cursor-pointer items-center gap-2 self-start text-sm font-bold underline underline-offset-4 hover:text-danger"
                >
                  <X size={14} aria-hidden="true" />
                  {t("clear")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
