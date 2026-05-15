"use client";

import { type MotionStyle, motion, useInView } from "framer-motion";
import { useRef } from "react";

type Direction = "up" | "down" | "left" | "right" | "none" | "scale";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  style?: MotionStyle;
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  once?: boolean;
}

const directionOffset: Record<Direction, object> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
  scale: { scale: 0.88 },
};

export function AnimateIn({
  children,
  className,
  style,
  delay = 0,
  duration = 0.65,
  direction = "up",
  distance,
  once = true,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px 0px" });

  const offset =
    distance !== undefined && (direction === "up" || direction === "down")
      ? { y: direction === "up" ? distance : -distance }
      : distance !== undefined && (direction === "left" || direction === "right")
        ? { x: direction === "left" ? distance : -distance }
        : directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      {...(style !== undefined ? { style } : {})}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger multiple children — wrap direct children in motion.div with index-based delay */
export function StaggerChildren({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  className,
  style,
  direction = "up",
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
  style?: React.CSSProperties;
  direction?: Direction;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  const offset = directionOffset[direction];

  return (
    <div ref={ref} className={className} style={style}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, ...offset }}
              animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.55,
                delay: initialDelay + i * staggerDelay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </div>
  );
}
