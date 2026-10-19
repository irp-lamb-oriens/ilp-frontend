"use client";

import {
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
} from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. Defaults to 3 for a restrained premium feel. */
  max?: number;
}

/**
 * Wraps a surface in a subtle cursor-reactive 3D tilt. The card leans toward
 * the pointer by up to `max` degrees. Transform-only, spring-damped, and fully
 * disabled under prefers-reduced-motion.
 */
export default function TiltCard({ children, className, max = 3 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const [hovered, setHovered] = useState(false);

  const springRx = useSpring(rx, { stiffness: 300, damping: 30 });
  const springRy = useSpring(ry, { stiffness: 300, damping: 30 });

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  }

  function onLeave() {
    if (reduce) return;
    rx.set(0);
    ry.set(0);
    setHovered(false);
  }

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX: springRx,
        rotateY: springRy,
        transformPerspective: 900,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      animate={{ scale: hovered ? 1.01 : 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}