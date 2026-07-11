import type { ReactNode } from "react";

/**
 * Infinite ticker. The track holds two identical halves so a
 * translateX(-50%) loop is seamless; direction flips via CSS for RTL.
 */
export default function Marquee({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const half = (
    <div className="flex shrink-0 items-center gap-10 pe-10">{children}</div>
  );
  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className}`}
      role="presentation"
    >
      <div className="marquee-track animate-marquee flex w-max">
        {half}
        <div aria-hidden="true" className="flex shrink-0 items-center gap-10 pe-10">
          {children}
        </div>
      </div>
    </div>
  );
}
