import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import GiftCardConfigurator from "@/components/gift/GiftCardConfigurator";
import { Reveal } from "@/components/motion/Reveal";
import { localizeDigits } from "@/lib/money";
import wordmark from "@/images/brand/wordmark.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("giftCards") };
}

export default async function GiftCardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "giftCards" });

  const steps = [t("how1"), t("how2"), t("how3")];

  return (
    <>
      <section className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-2 lg:gap-20">
        {/* Visual */}
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <div className="relative aspect-[4/3] overflow-hidden bg-ink">
              <Image
                src={wordmark}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                <p className="text-eyebrow text-paper/70">{t("eyebrow")}</p>
                <p
                  className="text-paper/90 text-lg font-black uppercase"
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontStretch: "125%",
                  }}
                >
                  Gift Card
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-10">
              <h2 className="text-eyebrow mb-5 text-ink/60">{t("howTitle")}</h2>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="price flex h-8 w-8 shrink-0 items-center justify-center bg-ink text-sm font-bold text-paper"
                    >
                      {localizeDigits(i + 1, locale)}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-ink/70">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>

        {/* Configurator */}
        <div>
          <Reveal>
            <p className="text-eyebrow mb-3 text-ink/60">{t("eyebrow")}</p>
            <h1 className="text-display text-4xl md:text-6xl">{t("title")}</h1>
            <p className="mt-5 max-w-lg leading-relaxed text-ink/70">
              {t("body")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <GiftCardConfigurator />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
