import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readPending2fa } from "@/lib/admin/auth";
import { glassCard } from "../../glass";
import AuthLogoMark from "../../components/AuthLogoMark";
import VerifyForm from "./VerifyForm";

export const metadata: Metadata = { title: "Verify two-factor code" };

export default async function VerifyLoginPage() {
  const userId = await readPending2fa();
  if (!userId) redirect("/admin/login");

  return (
    <div className="admin-gradient-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="text-2xl font-black tracking-tight text-slate-900">
            Enter your code
          </p>
          <p className="mt-1 text-sm text-slate-500">
            From the authenticator app you set up on this account.
          </p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
          <VerifyForm />
        </div>
      </div>
    </div>
  );
}
