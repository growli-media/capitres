"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, LinkSimple, WhatsappLogo, XLogo } from "@phosphor-icons/react";

/** Copy-link / X / WhatsApp sharing for Journal posts. */
export default function ShareButtons({ title }: { title: string }) {
  const t = useTranslations("blog");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable — no-op.
    }
  }

  function shareUrl(base: string) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    window.open(
      base === "x"
        ? `https://x.com/intent/post?text=${text}&url=${url}`
        : `https://wa.me/?text=${text}%20${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const btn =
    "flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 border border-line px-3 text-sm font-semibold transition-colors hover:border-ink";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-eyebrow me-1 text-ink/60">{t("share")}</span>
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        {copied ? (
          <>
            <Check size={16} aria-hidden="true" className="text-green" />
            {t("copied")}
          </>
        ) : (
          <>
            <LinkSimple size={16} aria-hidden="true" />
            {t("copyLink")}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => shareUrl("x")}
        className={btn}
        aria-label={t("shareX")}
      >
        <XLogo size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => shareUrl("wa")}
        className={btn}
        aria-label={t("shareWhatsApp")}
      >
        <WhatsappLogo size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
