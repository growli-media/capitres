import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { catalog } from "@/lib/catalog";
import { pick } from "@/lib/content";
import { formatDateNumeric } from "@/lib/dates";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("journal") };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, posts] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    catalog.getPosts(),
  ]);

  const [featured, ...rest] = posts;

  return (
    <>
      <section className="container-x pb-10 pt-14 md:pb-14 md:pt-20">
        <p className="text-eyebrow mb-3 text-ink/60">{t("eyebrow")}</p>
        <h1 className="text-display max-w-4xl text-5xl md:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-xl text-ink/65">{t("intro")}</p>
      </section>

      {/* Featured story */}
      {featured && (
        <section className="container-x pb-14">
          <Reveal>
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid cursor-pointer overflow-hidden bg-ink text-paper lg:grid-cols-5"
            >
              <div className="relative aspect-[4/3] overflow-hidden lg:col-span-3 lg:aspect-auto lg:min-h-[30rem]">
                <Image
                  src={featured.cover.src}
                  alt={pick(featured.cover.alt, locale)}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-col justify-between gap-10 p-7 lg:col-span-2 lg:p-12">
                <div>
                  <p className="text-eyebrow text-green">{t("featured")}</p>
                  <h2 className="text-display mt-4 text-3xl lg:text-4xl">
                    {pick(featured.title, locale)}
                  </h2>
                  <p className="mt-4 leading-relaxed text-paper/70">
                    {pick(featured.excerpt, locale)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-paper/55">
                  <span className="price">
                    {formatDateNumeric(featured.date, locale)}
                  </span>
                  <span>{t("readingTime", { min: featured.readingMinutes })}</span>
                </div>
              </div>
            </Link>
          </Reveal>
        </section>
      )}

      {/* More stories */}
      <section className="container-x pb-20 md:pb-28">
        <h2 className="text-eyebrow mb-8 text-ink/60">{t("moreStories")}</h2>
        <RevealGroup className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
          {rest.map((post) => (
            <RevealItem key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block cursor-pointer"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-studio">
                  <Image
                    src={post.cover.src}
                    alt={pick(post.cover.alt, locale)}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4 text-xs text-ink/60">
                  <span className="price">
                    {formatDateNumeric(post.date, locale)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{t("readingTime", { min: post.readingMinutes })}</span>
                </div>
                <h3 className="text-display mt-2 text-2xl">
                  <span className="link-underline">
                    {pick(post.title, locale)}
                  </span>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/65">
                  {pick(post.excerpt, locale)}
                </p>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
