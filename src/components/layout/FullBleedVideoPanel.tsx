import type { StaticImageData } from "next/image";
import { Link } from "@/i18n/navigation";
import HeroMedia from "./HeroMedia";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Video variant of FullBleedPanel — same full-viewport, bottom-anchored
 * text-over-media layout, but backed by HeroMedia (poster + looping,
 * customer-pausable video) instead of a plain <Image>. Used for both ends
 * of the homepage album: the opening panel and the closing "our story"
 * one, so a visitor lands on and leaves on the same kind of moment.
 */
export default function FullBleedVideoPanel({
  poster,
  videoSrc,
  eyebrow,
  title,
  sub,
  ctaLabel,
  href,
  showScrollCue = false,
}: {
  poster: StaticImageData;
  videoSrc: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  ctaLabel: string;
  href: string;
  /** Only the very first panel a visitor sees needs the "keep scrolling" hint. */
  showScrollCue?: boolean;
}) {
  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <HeroMedia poster={poster} videoSrc={videoSrc} />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-ink/20"
      />
      <Reveal className="absolute inset-x-0 bottom-0 flex flex-col items-center px-8 pb-16 text-center text-paper md:pb-20">
        {eyebrow && <p className="text-eyebrow mb-3 text-paper/75">{eyebrow}</p>}
        <h2 className="text-display max-w-4xl text-4xl md:text-6xl">{title}</h2>
        {sub && <p className="mt-4 max-w-xl text-paper/80 md:text-lg">{sub}</p>}
        <Link href={href} className="text-eyebrow link-underline mt-6 text-paper/90">
          {ctaLabel}
        </Link>
        {showScrollCue && (
          <span aria-hidden="true" className="scroll-cue mt-4" />
        )}
      </Reveal>
    </section>
  );
}
