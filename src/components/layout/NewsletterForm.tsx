"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";
import { isValidEmailClient } from "@/lib/validate";

type Status = "idle" | "sending" | "success" | "error" | "invalid";

export default function NewsletterForm({
  tone = "paper",
}: {
  tone?: "paper" | "ink";
}) {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmailClient(email)) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  const isDark = tone === "ink";

  return (
    <form onSubmit={onSubmit} noValidate>
      <label
        htmlFor={`newsletter-email-${tone}`}
        className={`text-eyebrow mb-3 block ${isDark ? "text-paper/50" : "text-ink/60"}`}
      >
        {t("placeholder")}
      </label>
      <div
        className={`flex border-b-2 pb-1 transition-colors ${
          isDark
            ? "border-paper/30 focus-within:border-paper"
            : "border-ink/30 focus-within:border-ink"
        }`}
      >
        <input
          id={`newsletter-email-${tone}`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "invalid") setStatus("idle");
          }}
          placeholder={t("placeholder")}
          className={`h-12 min-w-0 flex-1 bg-transparent text-base outline-none ${
            isDark ? "placeholder:text-paper/60" : "placeholder:text-ink/40"
          }`}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={`flex min-h-12 cursor-pointer items-center gap-2 px-3 text-sm font-bold uppercase tracking-cta transition-opacity hover:opacity-70 disabled:opacity-40 ${
            isDark ? "text-paper" : "text-ink"
          }`}
        >
          {status === "sending" ? t("sending") : t("cta")}
          <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
      </div>
      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {status === "success" && (
          <p className="font-semibold text-green">{t("success")}</p>
        )}
        {status === "error" && <p className="text-danger">{t("error")}</p>}
        {status === "invalid" && (
          <p className="text-danger">{t("invalidEmail")}</p>
        )}
      </div>
      <p className={`text-xs ${isDark ? "text-paper/60" : "text-ink/60"}`}>
        {t("privacy")}
      </p>
    </form>
  );
}
