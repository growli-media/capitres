import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Sign up" };

export default async function AdminSignupPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-black text-white shadow-sm">
            C
          </span>
          <p className="text-2xl font-black tracking-tight text-slate-900">
            CAPITRES
          </p>
          <p className="mt-1 text-sm text-slate-500">Create an admin account</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
