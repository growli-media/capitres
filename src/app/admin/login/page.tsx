import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated, legacyLoginAvailable } from "@/lib/admin/auth";
import { grantPreviewAccess } from "@/lib/launch-gate";
import { glassCard } from "../glass";
import AuthLogoMark from "../components/AuthLogoMark";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  // ?next=preview is the hidden pre-launch bypass link on the storefront's
  // countdown gate (see src/components/launch/LaunchGate.tsx) — anyone who
  // completes a real admin login through this page while it's set lands
  // on the live site instead of /admin. Remove this prop and the two
  // branches below once launch-gate.ts is deleted post-launch.
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const preview = next === "preview";
  if (await isAuthenticated()) {
    if (preview) await grantPreviewAccess();
    redirect(preview ? "/" : "/admin");
  }
  const legacyAvailable = await legacyLoginAvailable();

  return (
    <div className="admin-gradient-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogoMark />
          <p className="mt-1 text-sm text-slate-500">Store dashboard</p>
        </div>
        <div className={`rounded-3xl p-7 ${glassCard}`}>
          <LoginForm legacyAvailable={legacyAvailable} next={next} />
        </div>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-slate-400">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny footer mark, next/image is overkill */}
          <img
            src="/brand/growli-icon.png"
            alt=""
            className="h-3.5 w-3.5 opacity-70"
          />
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
