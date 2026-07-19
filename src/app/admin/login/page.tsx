import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
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
          <p className="mt-1 text-sm text-slate-500">Store dashboard</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
          Made by{" "}
          <a
            href="https://growli.media"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-500 transition-colors hover:text-slate-800"
          >
            Growli Media
          </a>{" "}
          in Germany · Growth through creativity
        </p>
      </div>
    </div>
  );
}
