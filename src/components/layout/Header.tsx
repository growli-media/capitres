"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CaretDown,
  ShoppingBag,
  List,
  X,
} from "@phosphor-icons/react";
import { Link, usePathname } from "@/i18n/navigation";
import { pick, type LocalizedString } from "@/lib/content";
import { useCart, useCartCount } from "@/lib/cart/store";
import type { ImageSource } from "@/lib/catalog/types";
import LanguageSwitcher from "./LanguageSwitcher";
import logoMark from "@/images/brand/logo.png";

export interface NavCollection {
  slug: string;
  title: LocalizedString;
  tagline: LocalizedString;
  image: ImageSource;
  imageAlt: LocalizedString;
  archived?: boolean;
}

export interface NavCategory {
  slug: string;
  title: LocalizedString;
}

type MegaPanel = "shop" | "collections" | null;

/**
 * Global header: sticky translucent bar, hover/focus mega-menus on
 * desktop, full-screen overlay menu on mobile, language switcher and
 * cart trigger. All spacing is logical so RTL mirrors for free.
 */
export default function Header({
  collections,
  categories,
}: {
  collections: NavCollection[];
  categories: NavCategory[];
}) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const pathname = usePathname();
  const openCart = useCart((s) => s.open);
  const count = useCartCount();

  const [scrolled, setScrolled] = useState(false);
  const [panel, setPanel] = useState<MegaPanel>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation and lock body scroll for the mobile overlay.
  useEffect(() => {
    setPanel(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPanel(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPanel(null), 160);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const shopLinks: { href: string; label: string; emphasis?: boolean }[] = [
    { href: "/shop", label: t("shopAll"), emphasis: true },
    { href: "/shop?new=1", label: t("newArrivals") },
    { href: "/shop?gender=men", label: t("men") },
    { href: "/shop?gender=women", label: t("women") },
    { href: "/shop?gender=unisex", label: t("unisex") },
    { href: "/shop?sale=1", label: t("sale") },
    { href: "/gift-cards", label: t("giftCards") },
  ];

  const categoryLinks = categories.map((c) => ({
    href: c.slug === "gift-cards" ? "/gift-cards" : `/shop?category=${c.slug}`,
    slug: c.slug,
    title: c.title,
  }));

  const featured = collections[0];

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled || panel || mobileOpen
          ? "border-line bg-paper/95 backdrop-blur-md"
          : "border-transparent bg-paper/80 backdrop-blur-sm"
      }`}
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? tA11y("closeMenu") : tA11y("openMenu")}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={24} /> : <List size={24} />}
        </button>

        {/* Wordmark — stays Latin in every locale, like the garment prints */}
        <Link href="/" className="flex cursor-pointer items-center gap-2.5">
          <Image
            src={logoMark}
            alt=""
            width={30}
            height={30}
            priority
            className="h-[26px] w-[26px] md:h-[30px] md:w-[30px]"
          />
          <span
            className="pt-0.5 text-lg font-black uppercase tracking-tight md:text-xl"
            style={{ fontFamily: "var(--font-archivo)", fontStretch: "125%" }}
          >
            Capitres
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label={tA11y("mainNav")}
          className="hidden flex-1 items-center justify-center lg:flex"
        >
          <ul className="flex items-center gap-1">
            <li
              onMouseEnter={() => {
                cancelClose();
                setPanel("shop");
              }}
            >
              <button
                type="button"
                aria-expanded={panel === "shop"}
                aria-controls="mega-shop"
                onClick={() => setPanel(panel === "shop" ? null : "shop")}
                className={`flex min-h-11 cursor-pointer items-center gap-1 px-4 text-sm font-semibold transition-colors hover:text-green ${
                  panel === "shop" ? "text-green" : ""
                }`}
              >
                {t("shop")}
                <CaretDown
                  size={12}
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${panel === "shop" ? "rotate-180" : ""}`}
                />
              </button>
            </li>
            <li
              onMouseEnter={() => {
                cancelClose();
                setPanel("collections");
              }}
            >
              <button
                type="button"
                aria-expanded={panel === "collections"}
                aria-controls="mega-collections"
                onClick={() =>
                  setPanel(panel === "collections" ? null : "collections")
                }
                className={`flex min-h-11 cursor-pointer items-center gap-1 px-4 text-sm font-semibold transition-colors hover:text-green ${
                  panel === "collections" ? "text-green" : ""
                }`}
              >
                {t("collections")}
                <CaretDown
                  size={12}
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${panel === "collections" ? "rotate-180" : ""}`}
                />
              </button>
            </li>
            {[
              { href: "/blog", label: t("journal") },
              { href: "/about", label: t("about") },
              { href: "/contact", label: t("contact") },
            ].map((item) => (
              <li key={item.href} onMouseEnter={() => setPanel(null)}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center px-4 text-sm font-semibold transition-colors hover:text-green"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={openCart}
            aria-label={tA11y("openCart", { count })}
            className="relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center transition-colors hover:text-green"
          >
            <ShoppingBag size={22} />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -end-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-green px-1 text-[11px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ---------- Desktop mega panels ---------- */}
      <div
        className={`absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_24px_48px_-24px_rgba(11,10,9,0.18)] lg:block ${
          panel ? "" : "pointer-events-none"
        }`}
        style={{
          opacity: panel ? 1 : 0,
          transform: panel ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {panel === "shop" && (
          <div
            id="mega-shop"
            className="container-x grid grid-cols-12 gap-10 py-10"
          >
            <div className="col-span-3">
              <p className="text-eyebrow mb-5 text-ink/60">{t("shop")}</p>
              <ul className="space-y-1">
                {shopLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`link-underline inline-flex min-h-9 items-center text-[15px] ${
                        l.emphasis ? "font-bold" : "font-medium"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-3">
              <p className="text-eyebrow mb-5 text-ink/60">{t("byCategory")}</p>
              <ul className="space-y-1">
                {categoryLinks.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={c.href}
                      className="link-underline inline-flex min-h-9 items-center text-[15px] font-medium"
                    >
                      {pick(c.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {featured && (
              <Link
                href={`/collections/${featured.slug}`}
                className="group col-span-6 grid cursor-pointer grid-cols-2 overflow-hidden bg-ink text-paper"
              >
                <div className="flex flex-col justify-between p-6">
                  <p className="text-eyebrow text-paper/60">
                    {t("featuredCollection")}
                  </p>
                  <div>
                    <p className="text-display text-2xl">
                      {pick(featured.title, locale)}
                    </p>
                    <p className="mt-2 text-sm text-paper/70">
                      {pick(featured.tagline, locale)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-paper">
                      {t("explore")}
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                      />
                    </span>
                  </div>
                </div>
                <div className="relative min-h-52 overflow-hidden">
                  <Image
                    src={featured.image}
                    alt={pick(featured.imageAlt, locale)}
                    fill
                    sizes="20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </Link>
            )}
          </div>
        )}

        {panel === "collections" && (
          <div
            id="mega-collections"
            className="container-x grid grid-cols-2 gap-6 py-10 xl:grid-cols-4"
          >
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[5/4] overflow-hidden bg-studio">
                  <Image
                    src={c.image}
                    alt={pick(c.imageAlt, locale)}
                    fill
                    sizes="22vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm font-bold">
                  <span className="link-underline">{pick(c.title, locale)}</span>
                </p>
                <p className="mt-1 text-xs text-ink/65">
                  {pick(c.tagline, locale)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Mobile overlay menu ----------
          NOTE: the header's backdrop-filter creates a containing block,
          so this panel uses absolute (not fixed) positioning below the
          bar with an explicit viewport-height calc. */}
      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full z-40 h-[calc(100dvh-4rem)] overflow-y-auto bg-paper transition-[opacity,transform] duration-300 md:h-[calc(100dvh-4.5rem)] lg:hidden ${
          mobileOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <nav aria-label={tA11y("mainNav")} className="container-x py-8">
          <p className="text-eyebrow mb-4 text-ink/60">{t("shop")}</p>
          <ul className="space-y-1 border-b border-line pb-6">
            {shopLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-display flex min-h-12 items-center text-3xl"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-eyebrow mb-4 mt-8 text-ink/60">
            {t("collections")}
          </p>
          <ul className="space-y-1 border-b border-line pb-6">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="flex min-h-12 items-center text-xl font-bold"
                >
                  {pick(c.title, locale)}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-8 space-y-1">
            {[
              { href: "/blog", label: t("journal") },
              { href: "/about", label: t("about") },
              { href: "/contact", label: t("contact") },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-12 items-center text-lg font-semibold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-line pt-6 sm:hidden">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
