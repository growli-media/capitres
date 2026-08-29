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
    <div className="admin-gradient-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
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
