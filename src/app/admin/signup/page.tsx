import type { Metadata } from "next";
import Image from "next/image";
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
          <Image
            src="/brand/logo-black.svg"
            alt="Capitres"
            width={867}
            height={99}
            className="mx-auto h-6 w-auto"
          />
          <p className="mt-3 text-sm text-slate-500">Create an admin account</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
