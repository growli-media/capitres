import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { glassCard } from "../glass";
import AuthLogoMark from "../components/AuthLogoMark";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Sign up" };

export default async function AdminSignupPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-slate-300/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-100/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="mt-1 text-sm text-slate-500">Create an admin account</p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
