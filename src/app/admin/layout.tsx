import type { Metadata } from "next";
import "../globals.css";

/**
 * /admin lives outside the [locale] segment (see proxy.ts's matcher) —
 * it's a single English-language control panel, not part of the
 * trilingual storefront, so it gets its own plain HTML shell here.
 * Auth is enforced one level down, in admin/(protected)/layout.tsx —
 * kept out of this file so /admin/login itself isn't behind the gate.
 */
export const metadata: Metadata = {
  title: { default: "Capitres Admin", template: "%s — Capitres Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
