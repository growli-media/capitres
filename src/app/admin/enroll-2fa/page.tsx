import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readPendingEnroll } from "@/lib/admin/auth";
import { getUserById } from "@/lib/admin/users";
import { enrollmentQrDataUrl, generateSecret } from "@/lib/admin/totp";
import { glassCard } from "../glass";
import AuthLogoMark from "../components/AuthLogoMark";
import EnrollForm from "./EnrollForm";

export const metadata: Metadata = { title: "Set up two-factor authentication" };

export default async function Enroll2faPage() {
  const userId = await readPendingEnroll();
  if (!userId) redirect("/admin/login");
  const user = await getUserById(userId);
  if (!user) redirect("/admin/login");

  const secret = generateSecret();
  const qrDataUrl = await enrollmentQrDataUrl(user.email, secret);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 py-10">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-slate-300/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-100/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="text-2xl font-black tracking-tight text-slate-900">
            Set up two-factor authentication
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Scan this with Google Authenticator, Authy, or any TOTP app —
            required before your account can sign in.
          </p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
          <EnrollForm qrDataUrl={qrDataUrl} secret={secret} />
        </div>
      </div>
    </div>
  );
}
