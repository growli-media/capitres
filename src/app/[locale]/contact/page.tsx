import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import ContactForm from "@/components/contact/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { SOCIAL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("contact") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <section className="container-x grid gap-14 py-14 md:py-20 lg:grid-cols-5 lg:gap-20">
      <div className="lg:col-span-2">
        <Reveal>
          <p className="text-eyebrow mb-3 text-ink/60">{t("eyebrow")}</p>
          <h1 className="text-display text-5xl md:text-6xl">{t("title")}</h1>
          <p className="mt-5 max-w-md leading-relaxed text-ink/65">
            {t("body")}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 border-t border-line pt-8">
            <h2 className="text-eyebrow mb-4 text-ink/60">{t("infoTitle")}</h2>
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-11 w-fit items-center gap-3 font-semibold"
            >
              <InstagramLogo size={22} aria-hidden="true" />
              <span className="link-underline">{SOCIAL.instagramHandle}</span>
            </a>
            <p className="mt-3 text-sm text-ink/65">{t("followBody")}</p>
            <p className="mt-6 text-sm text-ink/65">{t("responseTime")}</p>
          </div>
        </Reveal>
      </div>

      <div className="lg:col-span-3">
        <Reveal delay={0.05}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
