import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { readPendingEnroll } from "@/lib/admin/auth";
import { getUserById } from "@/lib/admin/users";
import { enrollmentQrDataUrl, generateSecret } from "@/lib/admin/totp";
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
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/brand/logo-black.svg"
            alt="Capitres"
            width={867}
            height={99}
            className="mx-auto mb-4 h-4 w-auto"
          />
          <p className="text-2xl font-black tracking-tight text-slate-900">
            Set up two-factor authentication
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Scan this with Google Authenticator, Authy, or any TOTP app —
            required before your account can sign in.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <EnrollForm qrDataUrl={qrDataUrl} secret={secret} />
        </div>
      </div>
    </div>
  );
}
