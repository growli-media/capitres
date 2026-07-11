"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/** Scroll-triggered entrance. Fades + rises once when 20% enters view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

/** Staggered children reveal for grids and lists. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={
        reduce
          ? {}
          : {
              hidden: { opacity: 0, y: 24 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-linked parallax wrapper — the child drifts vertically as the
 * wrapper crosses the viewport. Amount is in percent of element height.
 */
export function Parallax({
  children,
  amount = 12,
  className,
  style,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
  style?: MotionStyle;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${amount}%`, `${amount}%`],
  );

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={reduce ? style : { y, ...style }}>
        {children}
      </motion.div>
    </div>
  );
}

/** Hero-style scale-down as the user scrolls away. */
export function ParallaxScale({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={reduce ? undefined : { scale, opacity }}
        className="relative h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
