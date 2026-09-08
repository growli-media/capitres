import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated, legacyLoginAvailable } from "@/lib/admin/auth";
import { glassCard } from "../glass";
import AuthLogoMark from "../components/AuthLogoMark";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  const legacyAvailable = await legacyLoginAvailable();

  return (
    <div className="admin-gradient-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="mt-1 text-sm text-slate-500">Store dashboard</p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
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
