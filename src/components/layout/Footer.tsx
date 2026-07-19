import Image from "next/image";
import { useTranslations } from "next-intl";
import { InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import NewsletterForm from "./NewsletterForm";
import PaymentMethods from "./PaymentMethods";
import logoMark from "@/images/brand/logo.png";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tNews = useTranslations("newsletter");
  const tA11y = useTranslations("a11y");
  const year = new Date().getFullYear();

  const columns: {
    heading: string;
    links: { href: string; label: string }[];
  }[] = [
    {
      heading: t("shop"),
      links: [
        { href: "/shop", label: tNav("shopAll") },
        { href: "/shop?new=1", label: tNav("newArrivals") },
        { href: "/collections", label: tNav("collections") },
        { href: "/shop?sale=1", label: tNav("sale") },
        { href: "/gift-cards", label: tNav("giftCards") },
      ],
    },
    {
      heading: t("help"),
      links: [
        { href: "/size-guide", label: t("sizeGuide") },
        { href: "/shipping-returns", label: t("shippingReturns") },
        { href: "/privacy", label: t("privacy") },
        { href: "/terms", label: t("terms") },
      ],
    },
    {
      heading: t("company"),
      links: [
        { href: "/about", label: tNav("about") },
        { href: "/blog", label: tNav("journal") },
        { href: "/contact", label: tNav("contact") },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-12 lg:gap-8">
        {/* Brand + newsletter */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <Image
              src={logoMark}
              alt=""
              width={28}
              height={28}
              className="invert"
            />
            <span
              className="text-lg font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-archivo)", fontStretch: "125%" }}
            >
              Capitres
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-paper/60">{t("tagline")}</p>

          <div className="mt-8 max-w-sm">
            <p className="text-display mb-1 text-xl">{tNews("title")}</p>
            <p className="mb-4 text-sm text-paper/60">{tNews("body")}</p>
            <NewsletterForm tone="ink" />
          </div>
        </div>

        {/* Link columns */}
        <nav
          aria-label={tA11y("footerNav")}
          className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:ps-12"
        >
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-eyebrow mb-5 text-paper/60">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="link-underline text-sm font-medium text-paper/85 hover:text-paper"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Accepted payments */}
      <div className="container-x flex flex-col gap-3 border-t border-paper/15 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-eyebrow text-paper/50">{t("acceptedPayments")}</p>
        <PaymentMethods />
      </div>

      {/* Bottom bar */}
      <div className="container-x flex flex-col gap-4 border-t border-paper/15 py-6 text-xs text-paper/50 md:flex-row md:items-center md:justify-between">
        <p>{t("rights", { year })}</p>
        <div className="flex items-center gap-5">
          <span>{t("madeIn")}</span>
          <span aria-hidden="true">·</span>
          <span>{t("paymentNote")}</span>
          <a
            href="https://www.instagram.com/capitres"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram — @capitres"
            className="flex min-h-11 min-w-11 items-center justify-center text-paper/70 transition-colors hover:text-paper"
          >
            <InstagramLogo size={20} />
          </a>
        </div>
      </div>

      {/* Oversized brand sign-off (decorative, CSS-only) */}
      <div aria-hidden="true" className="footer-watermark" />
    </footer>
  );
}
