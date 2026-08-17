import Image, { type ImageProps } from "next/image";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/Reveal";

type Half = {
  image: ImageProps["src"];
  alt: string;
  label: string;
  cta: string;
  href: string;
};

/**
 * A full-viewport section split into two halves side by side (stacked on
 * mobile) — YSL's "two tiles" moment. Each half is a full-bleed image with a
 * centred label and link.
 */
export default function SplitPanel({
  left,
  right,
}: {
  left: Half;
  right: Half;
}) {
  return (
    <section className="relative grid h-[100svh] w-full grid-cols-1 md:grid-cols-2">
      {[left, right].map((h, i) => (
        <Link
          key={i}
          href={h.href}
          className="group relative flex cursor-pointer items-center justify-center overflow-hidden bg-studio"
        >
          <Image
            src={h.image}
            alt={h.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/20 transition-colors duration-500 group-hover:bg-ink/30"
          />
          <Reveal className="relative z-10 flex flex-col items-center text-center text-paper">
            <h2 className="text-display text-3xl md:text-5xl">{h.label}</h2>
            <span className="text-eyebrow link-underline mt-4">{h.cta}</span>
          </Reveal>
        </Link>
      ))}
    </section>
  );
}
