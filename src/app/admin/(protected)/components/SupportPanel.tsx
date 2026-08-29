"use client";

import { useState } from "react";
import { Question, WhatsappLogo, EnvelopeSimple, InstagramLogo } from "@phosphor-icons/react";
import Modal from "./Modal";
import { toWhatsAppLink } from "@/lib/admin/whatsapp";
import { SUPPORT_CONTACT } from "@/lib/admin/support-contact";

export default function SupportPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Question size={18} aria-hidden="true" />
        Support
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Support">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{SUPPORT_CONTACT.description}</p>

        <div className="mt-4 space-y-1 text-sm">
          <p className="font-medium text-slate-900 dark:text-slate-100">{SUPPORT_CONTACT.contactPerson}</p>
          <p className="text-slate-500 dark:text-slate-400">Speaks {SUPPORT_CONTACT.languages.join(", ")}</p>
        </div>

        <div className="mt-5 space-y-2">
          <a
            href={toWhatsAppLink(SUPPORT_CONTACT.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-3 rounded-lg bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
          >
            <WhatsappLogo size={18} weight="fill" />
            WhatsApp
          </a>
          <a
            href={`mailto:${SUPPORT_CONTACT.email}`}
            className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <EnvelopeSimple size={18} />
            {SUPPORT_CONTACT.email}
          </a>
          <a
            href={SUPPORT_CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <InstagramLogo size={18} />
            Instagram
          </a>
        </div>
      </Modal>
    </>
  );
}
