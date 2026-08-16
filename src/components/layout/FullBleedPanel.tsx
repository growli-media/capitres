import Image, { type ImageProps } from "next/image";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/Reveal";

/**
 * A single full-viewport (100svh) editorial panel — the building block of
 * the Saint-Laurent-style homepage: a full-bleed image, a soft gradient for
 * legibility, and a minimal centred label that fades up as the panel scrolls
 * into view. Scrolling moves through these one screen at a time.
 */
export default function FullBleedPanel({
  image,
  alt,
  eyebrow,
  title,
  ctaLabel,
  href,
  priority = false,
  align = "center",
}: {
  image: ImageProps["src"];
  alt: string;
  eyebrow?: string;
  title: string;
  ctaLabel: string;
  href: string;
  priority?: boolean;
  align?: "center" | "start";
}) {
  const place =
    align === "center"
      ? "items-center text-center"
      : "items-start text-start";

  return (
    <section className="snap-panel relative h-[100svh] w-full overflow-hidden bg-ink">
      <Image
        src={image}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-ink/20"
      />
      <Reveal
        className={`absolute inset-x-0 bottom-0 flex flex-col ${place} px-8 pb-16 text-paper md:pb-20`}
      >
        {eyebrow && (
          <p className="text-eyebrow mb-3 text-paper/75">{eyebrow}</p>
        )}
        <h2 className="text-display max-w-4xl text-4xl md:text-6xl">{title}</h2>
        <Link
          href={href}
          className="text-eyebrow link-underline mt-6 text-paper/90"
        >
          {ctaLabel}
        </Link>
      </Reveal>
    </section>
  );
}
