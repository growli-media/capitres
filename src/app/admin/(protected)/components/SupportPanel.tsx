"use client";

import { useState } from "react";
import { Question, WhatsappLogo, EnvelopeSimple, InstagramLogo } from "@phosphor-icons/react";
import Modal from "./Modal";
import { toWhatsAppLink } from "@/lib/admin/whatsapp";
import { SUPPORT_CONTACT } from "@/lib/admin/support-contact";
import { glassButtonSecondary } from "../../glass";

export default function SupportPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-full border border-[#1B3445]/10 bg-[#1B3445]/[0.03] px-3 text-sm font-medium text-[#5A7387] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md transition-all hover:border-[#1B3445]/20 hover:bg-[#1B3445]/[0.06] hover:text-[#1B3445] dark:border-white/12 dark:bg-white/5 dark:text-[#aebfce] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:hover:border-white/25 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
      >
        <Question size={18} aria-hidden="true" />
        Support
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Support">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{SUPPORT_CONTACT.description}</p>

        <div className="mt-5 space-y-2.5">
          <a
            href={toWhatsAppLink(SUPPORT_CONTACT.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-3 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-4 text-sm font-semibold text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md transition-all hover:bg-emerald-100/80 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
          >
            <WhatsappLogo size={18} weight="fill" />
            WhatsApp
          </a>
          <a
            href={`mailto:${SUPPORT_CONTACT.email}`}
            className={`flex h-11 items-center gap-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 ${glassButtonSecondary}`}
          >
            <EnvelopeSimple size={18} />
            {SUPPORT_CONTACT.email}
          </a>
          <a
            href={SUPPORT_CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-11 items-center gap-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 ${glassButtonSecondary}`}
          >
            <InstagramLogo size={18} />
            Instagram
          </a>
        </div>
      </Modal>
    </>
  );
}
