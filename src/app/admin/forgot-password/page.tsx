import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { glassCard } from "../glass";
import AuthLogoMark from "../components/AuthLogoMark";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="admin-gradient-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="text-2xl font-black tracking-tight text-slate-900">
            Reset your password
          </p>
          <p className="mt-1 text-sm text-slate-500">
            We&rsquo;ll email you a code to reset it.
          </p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
