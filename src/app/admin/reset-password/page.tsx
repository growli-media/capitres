import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { glassCard } from "../glass";
import AuthLogoMark from "../components/AuthLogoMark";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="admin-gradient-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="text-2xl font-black tracking-tight text-slate-900">
            Enter your reset code
          </p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
