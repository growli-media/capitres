import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isAuthenticated, legacyLoginAvailable } from "@/lib/admin/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  const legacyAvailable = await legacyLoginAvailable();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/brand/logo-black.svg"
            alt="Capitres"
            width={867}
            height={99}
            priority
            className="mx-auto h-6 w-auto"
          />
          <p className="mt-3 text-sm text-slate-500">Store dashboard</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <LoginForm legacyAvailable={legacyAvailable} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-slate-400">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny footer mark, next/image is overkill */}
          <img src="/brand/growli-icon.png" alt="" className="h-3.5 w-3.5 opacity-70" />
          <p>
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
    </div>
  );
}
