import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Parallax, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import heroImage from "@/images/brand/hero-editorial.jpg";
import wordmark from "@/images/brand/wordmark.png";
import imgIraq70 from "@/images/products/iraq-70.jpg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("about") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  const values = [1, 2, 3].map((n) => ({
    title: t(`value${n}Title`),
    body: t(`value${n}Body`),
  }));

  return (
    <>
      {/* Hero */}
      <section className="container-x pb-14 pt-14 md:pb-20 md:pt-24">
        <Reveal>
          <p className="text-eyebrow mb-4 text-ink/60">{t("eyebrow")}</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="text-display max-w-5xl text-[clamp(2.5rem,7.5vw,6.5rem)]">
            {t("title")}
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-ink/80 md:text-2xl md:leading-relaxed">
            {t("lede")}
          </p>
        </Reveal>
      </section>

      {/* Image band */}
      <Parallax amount={10}>
        <div className="relative aspect-[21/9] min-h-72 bg-ink">
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_25%] opacity-80"
          />
        </div>
      </Parallax>

      {/* Story */}
      <section className="container-x grid gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        <Reveal>
          <p className="text-lg leading-[1.9] text-ink/80">{t("body1")}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-lg leading-[1.9] text-ink/80">{t("body2")}</p>
        </Reveal>
      </section>

      {/* Quote */}
      <section className="bg-ink py-20 text-paper md:py-28">
        <div className="container-x text-center">
          <Reveal>
            <p className="text-display mx-auto max-w-4xl text-[clamp(2rem,6vw,5rem)]">
              “{t("quote")}”
            </p>
            <p className="text-eyebrow mt-6 text-paper/50">
              {t("quoteAttribution")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="container-x py-16 md:py-24">
        <Reveal>
          <h2 className="text-display mb-12 text-3xl md:text-5xl">
            {t("valuesTitle")}
          </h2>
        </Reveal>
        <RevealGroup className="grid gap-10 md:grid-cols-3">
          {values.map((v, i) => (
            <RevealItem key={i}>
              <div className="border-t-2 border-ink pt-5">
                <p className="price text-sm font-bold text-green">
                  0{i + 1}
                </p>
                <h3 className="text-display mt-2 text-xl md:text-2xl">
                  {v.title}
                </h3>
                <p className="mt-3 leading-relaxed text-ink/65">{v.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* CTA */}
      <section className="container-x pb-20 md:pb-28">
        <div className="relative overflow-hidden bg-ink text-paper">
          <Image
            src={imgIraq70}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="relative flex flex-col items-start gap-5 p-8 md:p-16">
            <h2 className="text-display max-w-2xl text-3xl md:text-5xl">
              {t("ctaTitle")}
            </h2>
            <p className="max-w-md text-paper/75">{t("ctaBody")}</p>
            <Link href="/collections/heritage-capsule" className="btn btn-paper mt-2">
              {t("cta")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
