import Image from "next/image";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { LAUNCH_AT_UTC } from "@/lib/launch-gate";
import launchImage from "@/images/brand/launch-royal-returns.jpg";
import LaunchCountdown from "./LaunchCountdown";

/**
 * Full-screen pre-launch page. Background is the "Royal Returns" campaign
 * still, which already carries the CAPITRES wordmark and its own
 * headline baked into the photo — the countdown below is bottom-anchored
 * deliberately so it never competes with that text for the same middle
 * of the frame, and only adds what the still doesn't already say.
 */
export default async function LaunchGate({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "launchGate" });
  const h = await headers();
  const ipTimeZone = h.get("x-vercel-ip-timezone");

  return (
    <div className="relative flex h-[100svh] w-full items-end justify-center overflow-hidden bg-ink text-paper">
      <Image
        src={launchImage}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={82}
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-ink/25" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
      />
      <Reveal className="relative z-10 flex flex-col items-center px-6 pb-14 text-center md:pb-20">
        <p className="max-w-md text-paper/80 md:text-lg">{t("subtitle")}</p>
        <LaunchCountdown launchAtUtc={LAUNCH_AT_UTC} serverTimeZoneHint={ipTimeZone} />
      </Reveal>
    </div>
  );
}
