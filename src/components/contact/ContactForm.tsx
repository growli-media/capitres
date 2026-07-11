"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { isValidEmailClient } from "@/lib/validate";

const SUBJECTS = ["order", "product", "wholesale", "press", "other"] as const;

export default function ContactForm() {
  const t = useTranslations("contact");
  const tErr = useTranslations("checkout.errors");
  const locale = useLocale();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "order",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  function setField(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = tErr("required");
    if (!isValidEmailClient(form.email)) next.email = tErr("invalidEmail");
    if (!form.message.trim()) next.message = tErr("required");
    setErrors(next);
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      document.getElementById(`contact-${firstKey}`)?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p
        role="status"
        className="border-s-2 border-green bg-studio px-6 py-5 font-semibold text-green"
      >
        {t("success")}
      </p>
    );
  }

  const input = (hasError: boolean) =>
    `w-full border bg-white text-base outline-none transition-colors focus:border-ink ${
      hasError ? "border-danger" : "border-line"
    }`;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-2 block text-sm font-semibold"
          >
            {t("name")} *
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={`h-12 px-4 ${input(Boolean(errors.name))}`}
          />
          {errors.name && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-2 block text-sm font-semibold"
          >
            {t("email")} *
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            className={`h-12 px-4 ${input(Boolean(errors.email))}`}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="mb-2 block text-sm font-semibold"
        >
          {t("subject")}
        </label>
        <select
          id="contact-subject"
          value={form.subject}
          onChange={(e) => setField("subject", e.target.value)}
          className={`h-12 cursor-pointer appearance-none px-4 ${input(false)}`}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {t(`subject${s.charAt(0).toUpperCase()}${s.slice(1)}` as
                | "subjectOrder"
                | "subjectProduct"
                | "subjectWholesale"
                | "subjectPress"
                | "subjectOther")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block text-sm font-semibold"
        >
          {t("message")} *
        </label>
        <textarea
          id="contact-message"
          rows={6}
          value={form.message}
          onChange={(e) => setField("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          className={`p-4 ${input(Boolean(errors.message))}`}
        />
        {errors.message && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {errors.message}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {state === "error" && (
          <p className="mb-4 text-sm font-semibold text-danger">{t("error")}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className="btn btn-ink"
      >
        {state === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
