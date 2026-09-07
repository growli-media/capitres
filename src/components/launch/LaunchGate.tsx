import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/Reveal";
import { LAUNCH_AT_UTC } from "@/lib/launch-gate";
import launchImage from "@/images/brand/launch-royal-returns.jpg";
import LaunchCountdown from "./LaunchCountdown";

/**
 * Full-screen pre-launch page. Background is the "Royal Returns" campaign
 * still, shown at its own natural brightness (no darkening overlay) and
 * unoptimized so the baked-in wordmark stays pixel-sharp rather than
 * getting resampled — it already carries the CAPITRES wordmark and its
 * own headline, so the countdown below is bottom-anchored deliberately,
 * to never compete with that text for the same middle of the frame, and
 * only adds what the still doesn't already say. Text gets a drop shadow
 * instead of a scrim for legibility, since the photo's own brightness
 * varies (the wall behind the subject is much lighter than the blazer).
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
        unoptimized
        className="object-cover"
      />
      <Reveal className="relative z-10 flex flex-col items-center px-6 pb-5 text-center [text-shadow:0_2px_16px_rgba(0,0,0,0.85),0_1px_4px_rgba(0,0,0,0.9)] md:pb-8">
        <p className="max-w-md text-paper/90 md:text-lg">{t("subtitle")}</p>
        <LaunchCountdown
          launchAtUtc={LAUNCH_AT_UTC}
          serverTimeZoneHint={ipTimeZone}
        />
      </Reveal>
      {/* Deliberately near-invisible: same black as the blazer it sits
          over, no visible affordance for an ordinary visitor. Admin-only
          door in — see the "next=preview" flow in admin/login/page.tsx. */}
      <Link
        href="/admin/login?next=preview"
        aria-label="Preview access"
        title="Preview"
        className="absolute end-4 bottom-4 z-10 h-9 w-9 rounded-sm bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper/60"
      />
    </div>
  );
}
