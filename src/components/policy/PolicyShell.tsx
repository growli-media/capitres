import type { ReactNode } from "react";

/** Narrow editorial shell shared by all policy pages. */
export default function PolicyShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="container-x py-14 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-display text-4xl md:text-6xl">{title}</h1>
        {intro && (
          <p className="mt-6 text-lg leading-relaxed text-ink/70">{intro}</p>
        )}
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </section>
  );
}
