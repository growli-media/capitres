import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("collections") };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, collections, products] = await Promise.all([
    getTranslations({ locale, namespace: "collectionsPage" }),
    catalog.getCollections(),
    catalog.getProducts(),
  ]);

  const countFor = (slug: string) =>
    products.filter((p) => p.collectionSlugs.includes(slug)).length;

  return (
    <>
      <section className="container-x pb-10 pt-14 md:pb-16 md:pt-20">
        <p className="text-eyebrow mb-3 text-ink/60">{t("eyebrow")}</p>
        <h1 className="text-display max-w-4xl text-5xl md:text-7xl">
          {t("title")}
        </h1>
      </section>

      <section className="container-x space-y-6 pb-20 md:space-y-8 md:pb-28">
        {collections.map((c, i) => (
          <Reveal key={c.slug}>
            <Link
              href={`/collections/${c.slug}`}
              className="group grid cursor-pointer overflow-hidden border border-line bg-white md:grid-cols-2"
            >
              <div
                className={`relative aspect-[4/3] overflow-hidden bg-studio md:aspect-auto md:min-h-[26rem] ${
                  i % 2 === 1 ? "md:order-2" : ""
                }`}
              >
                <Image
                  src={c.heroImage.src}
                  alt={pick(c.heroImage.alt, locale)}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div
                className={`flex flex-col justify-between gap-10 p-7 md:p-12 ${
                  c.theme === "dark" ? "bg-ink text-paper" : "bg-white"
                }`}
              >
                <div>
                  {c.archived && (
                    <p className="text-eyebrow mb-4 inline-block bg-terracotta px-2.5 py-1.5 text-white">
                      {t("archived")}
                    </p>
                  )}
                  <h2 className="text-display text-3xl md:text-5xl">
                    {pick(c.title, locale)}
                  </h2>
                  <p
                    className={`mt-3 text-sm font-semibold ${
                      c.theme === "dark" ? "text-green" : "text-green"
                    }`}
                  >
                    {pick(c.tagline, locale)}
                  </p>
                  <p
                    className={`mt-5 max-w-md leading-relaxed ${
                      c.theme === "dark" ? "text-paper/70" : "text-ink/65"
                    }`}
                  >
                    {pick(c.description, locale)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${c.theme === "dark" ? "text-paper/50" : "text-ink/60"}`}
                  >
                    {!c.archived && t("itemsCount", { count: countFor(c.slug) })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <span className="link-underline">{t("explore")}</span>
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="rtl:-scale-x-100"
                    />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
