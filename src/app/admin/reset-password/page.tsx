import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  if (await isAuthenticated()) redirect("/admin");

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
            Enter your reset code
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
