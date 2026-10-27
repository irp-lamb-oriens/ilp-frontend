"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type AnimationEvent,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { REVEAL_WINDOW_MS, STAGGER_MAX } from "./loadingTiming";
import s from "./Stagger.module.scss";

const StaggerCtx = createContext<number | null>(null);

/**
 * Marks the moment content first lands. <StaggerItem>s inside that mount within
 * REVEAL_WINDOW_MS animate in; anything mounting later (refetch, tab switch,
 * "show all", a new row) just appears. Renders no element of its own.
 */
export function Stagger({ children }: { children: ReactNode }) {
  const [start] = useState(() => Date.now());
  return <StaggerCtx.Provider value={start}>{children}</StaggerCtx.Provider>;
}

export interface RevealProps {
  className: string | undefined;
  "data-reveal-i"?: number;
  onAnimationEnd?: (e: AnimationEvent<HTMLElement>) => void;
}

/**
 * The reveal as props, for elements that cannot be wrapped (table rows).
 * `index` sets the delay step (0 = first); steps past STAGGER_MAX share the last delay.
 */
export function useReveal(index = 0, className?: string): RevealProps {
  const start = useContext(StaggerCtx);
  const [play, setPlay] = useState(() => start === null || Date.now() - start < REVEAL_WINDOW_MS);
  const onAnimationEnd = useCallback((e: AnimationEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) setPlay(false);
  }, []);
  if (!play) return { className: cx(s.item, className) };
  return {
    className: cx(s.item, s.reveal, className),
    "data-reveal-i": Math.min(Math.max(0, Math.round(index)), STAGGER_MAX),
    onAnimationEnd,
  };
}

export interface StaggerItemProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Default div. */
  as?: ElementType;
  /** Position in the reveal order (0 lands first). */
  index?: number;
  children?: ReactNode;
}

/**
 * Fades and lifts its content in on first load, `index` steps after its
 * <Stagger> scope. Outside a scope it animates once on mount (error and empty
 * states). Empty wrappers collapse, so wrapping a component that may render
 * null leaves no gap.
 */
export function StaggerItem({ as: Tag = "div", index = 0, className, children, onAnimationEnd, ...rest }: StaggerItemProps) {
  const reveal = useReveal(index, className);
  return (
    <Tag
      {...rest}
      className={reveal.className}
      data-reveal-i={reveal["data-reveal-i"]}
      onAnimationEnd={(e: AnimationEvent<HTMLElement>) => {
        reveal.onAnimationEnd?.(e);
        onAnimationEnd?.(e);
      }}
    >
      {children}
    </Tag>
  );
}

export default Stagger;
