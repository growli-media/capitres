"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localizeDigits } from "@/lib/money";

/** How often to nudge the server once the clock says we should be live,
 * in case of a few seconds of clock drift between this device and the
 * server — the gate unmounts itself the moment the server agrees. */
const REFRESH_RETRY_MS = 3000;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTimeIn(timeZone: string, date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Milliseconds until `launchAt`, ticking every second. The server
 * snapshot is deliberately `null` (a live countdown can't have a "correct"
 * server-rendered value — it's stale the instant it's sent) so hydration
 * never mismatches; the real number fills in the moment the client store
 * takes over, exactly like usePrefersReducedMotion's own server/client
 * split. */
function useRemainingMs(launchAt: Date): number | null {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, 1000);
      return () => clearInterval(id);
    },
    () => launchAt.getTime() - Date.now(),
    () => null,
  );
}

/** Live countdown to `launchAtUtc`, shown in Baghdad time — the one
 * timezone that actually matters here, so there's nothing to convert. */
export default function LaunchCountdown({
  launchAtUtc,
}: {
  launchAtUtc: string;
}) {
  const t = useTranslations("launchGate");
  const locale = useLocale();
  const router = useRouter();
  const launchAt = useMemo(() => new Date(launchAtUtc), [launchAtUtc]);
  const remaining = useRemainingMs(launchAt);

  useEffect(() => {
    if (remaining === null || remaining > 0) return;
    router.refresh();
    const retry = setInterval(() => router.refresh(), REFRESH_RETRY_MS);
    return () => clearInterval(retry);
  }, [remaining, router]);

  const localize = (s: string) =>
    locale === "ar" || locale === "ku" ? localizeDigits(s, locale) : s;

  if (remaining === null) {
    // Pre-hydration: nothing numeric yet, to avoid a server/client mismatch.
    return <div className="mt-5 h-24" aria-hidden />;
  }

  if (remaining <= 0) {
    return (
      <p className="mt-5 text-lg font-medium text-paper/90">{t("opening")}</p>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const digits = localize(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
  const baghdadTime = localize(formatTimeIn("Asia/Baghdad", launchAt));

  return (
    <div className="mt-5 flex flex-col items-center gap-4">
      <div
        dir="ltr"
        className="text-display text-5xl tracking-wide tabular-nums sm:text-6xl md:text-7xl"
      >
        {digits}
      </div>
      <p className="text-sm text-paper/75 md:text-base">
        {t("baghdad", { time: baghdadTime })}
      </p>
    </div>
  );
}
