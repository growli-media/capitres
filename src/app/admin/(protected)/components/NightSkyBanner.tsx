/**
 * Decorative banner at the top of the dashboard home — the slot that used
 * to hold a rotating quote-of-the-day card (removed in an earlier redesign
 * pass). Replaced with a piece of Growli-branded art instead: a dark navy
 * night sky (night-sky-bg in globals.css — always navy, unlike the
 * sidebar's theme-aware background, since a starry sky shouldn't turn
 * white just because the admin theme toggle does), twinkling stars, two
 * shooting stars on independent cycles, a moon, and — this is the store
 * owner's own dashboard, not Growli's — the Capitres wordmark and tagline
 * centered small, not Growli's mark (that lives in the sidebar as the
 * "built by" signature). Purely decorative — aria-hidden, no data or
 * interaction here.
 */

const STARS: { top: string; left: string; size: number; delay: string; duration: string }[] = [
  { top: "14%", left: "8%", size: 2, delay: "0.2s", duration: "2.6s" },
  { top: "24%", left: "18%", size: 1.5, delay: "1.1s", duration: "3.2s" },
  { top: "10%", left: "30%", size: 1.5, delay: "2.3s", duration: "2.8s" },
  { top: "38%", left: "42%", size: 2, delay: "0.6s", duration: "3.6s" },
  { top: "18%", left: "54%", size: 1.5, delay: "1.8s", duration: "2.4s" },
  { top: "30%", left: "63%", size: 2, delay: "0.9s", duration: "3.1s" },
  { top: "12%", left: "76%", size: 1.5, delay: "2.6s", duration: "2.9s" },
  { top: "42%", left: "86%", size: 2, delay: "1.4s", duration: "3.4s" },
  { top: "62%", left: "10%", size: 1.5, delay: "0.4s", duration: "2.7s" },
  { top: "74%", left: "22%", size: 2, delay: "2.1s", duration: "3.3s" },
  { top: "58%", left: "34%", size: 1.5, delay: "1.6s", duration: "2.5s" },
  { top: "82%", left: "46%", size: 2, delay: "0.8s", duration: "3.8s" },
  { top: "68%", left: "56%", size: 1.5, delay: "2.4s", duration: "2.6s" },
  { top: "52%", left: "68%", size: 2, delay: "1.2s", duration: "3.5s" },
  { top: "80%", left: "80%", size: 1.5, delay: "0.3s", duration: "2.9s" },
  { top: "64%", left: "90%", size: 2, delay: "1.9s", duration: "3.2s" },
  { top: "6%", left: "45%", size: 1.5, delay: "2.8s", duration: "2.3s" },
  { top: "22%", left: "94%", size: 1.5, delay: "0.7s", duration: "3.7s" },
  { top: "46%", left: "4%", size: 2, delay: "1.5s", duration: "2.8s" },
  { top: "88%", left: "64%", size: 1.5, delay: "2.2s", duration: "3.1s" },
];

export default function NightSkyBanner() {
  return (
    <div
      className="night-sky-bg relative mb-6 overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_30px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    >
      <div className="relative flex h-36 items-center justify-center md:h-44">
        {/* Moon + stars drift together as one layer (see
            starfield-drift-30 in globals.css) — shooting stars stay
            outside it, their own streak animation already moves them. */}
        <div className="night-sky-drift absolute inset-0" style={{ animation: "starfield-drift-30 90s ease-in-out infinite" }}>
          <div className="absolute end-8 top-6 h-9 w-9 rounded-full bg-[#eef2f7] shadow-[0_0_28px_8px_rgba(238,242,247,0.3)]" />

          {STARS.map((s, i) => (
            <span
              key={i}
              className="night-sky-star pointer-events-none absolute rounded-full bg-white"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                animation: `star-twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Two independent cycles (7s / 11s) so the shooting stars drift
            out of sync instead of visibly repeating together. */}
        <span
          className="night-sky-shooting-star pointer-events-none absolute start-[12%] top-[22%] h-px w-14 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
          style={{ animation: "shooting-star-a 7s linear infinite" }}
        />
        <span
          className="night-sky-shooting-star pointer-events-none absolute start-[70%] top-[58%] h-px w-16 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
          style={{ animation: "shooting-star-b 11s linear infinite" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image needs a fixed size, this scales with the banner */}
          <img
            src="/brand/logo-white.svg"
            alt="Capitres"
            className="h-7 w-auto opacity-95 drop-shadow-[0_0_14px_rgba(143,199,239,0.4)] md:h-8"
          />
          <p className="text-[10px] font-medium tracking-[0.25em] text-white/60 uppercase md:text-[11px]">
            Declare Your Passion
          </p>
        </div>
      </div>
    </div>
  );
}
