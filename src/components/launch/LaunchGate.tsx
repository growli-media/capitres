import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import HeroMedia from "@/components/layout/HeroMedia";
import { Reveal } from "@/components/motion/Reveal";
import { LAUNCH_AT_UTC } from "@/lib/launch-gate";
import royalEraPoster from "@/images/brand/hero-royal-era-poster.jpg";
import LaunchCountdown from "./LaunchCountdown";

/**
 * Full-screen pre-launch page — same footage as the homepage's own
 * opening panel (see [locale]/page.tsx's "Scroll 1: Royal Era"), so the
 * first thing anyone sees before launch is the same thing they'll see
 * the moment it's live. Darkened further than that panel (a flat dim
 * plus a bottom-weighted gradient, no blur) since every word here has to
 * read clearly with nothing else on the page competing for attention.
 */
export default async function LaunchGate({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "launchGate" });
  const h = await headers();
  const ipTimeZone = h.get("x-vercel-ip-timezone");

  return (
    <div className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden bg-ink text-paper">
      <HeroMedia poster={royalEraPoster} videoSrc="/hero-royal-era.mp4" />
      <div aria-hidden="true" className="absolute inset-0 bg-ink/50" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/50"
      />
      <Reveal className="relative z-10 flex flex-col items-center px-6 text-center">
        <p className="text-eyebrow mb-4 text-paper/70">{t("eyebrow")}</p>
        <h1 className="text-display max-w-3xl text-4xl sm:text-6xl md:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-md text-paper/80 md:text-lg">
          {t("subtitle")}
        </p>
        <LaunchCountdown
          launchAtUtc={LAUNCH_AT_UTC}
          serverTimeZoneHint={ipTimeZone}
        />
      </Reveal>
    </div>
  );
}
