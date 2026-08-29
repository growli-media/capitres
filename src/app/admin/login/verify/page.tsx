import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { readPending2fa } from "@/lib/admin/auth";
import VerifyForm from "./VerifyForm";

export const metadata: Metadata = { title: "Verify two-factor code" };

export default async function VerifyLoginPage() {
  const userId = await readPending2fa();
  if (!userId) redirect("/admin/login");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-4">
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
            Enter your code
          </p>
          <p className="mt-1 text-sm text-slate-500">
            From the authenticator app you set up on this account.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <VerifyForm />
        </div>
      </div>
    </div>
  );
}
