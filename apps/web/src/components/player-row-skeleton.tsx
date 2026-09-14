"use client";

import { motion, useReducedMotion } from "motion/react";

export function PlayerRowSkeleton() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.li
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 gap-y-1 py-3 max-[480px]:grid-cols-[auto_1fr_auto] max-[480px]:gap-y-2"
      animate={reducedMotion ? { opacity: 0.6 } : { opacity: [1, 0.5, 1] }}
      transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity }}
    >
      <div className="h-5 w-5 rounded-sm bg-[var(--muted)]" />
      <div className="flex flex-col gap-1 max-[480px]:col-start-2">
        <div className="h-4 w-32 rounded-sm bg-[var(--muted)]" />
        <div className="h-3 w-20 rounded-sm bg-[var(--muted)]" />
      </div>
      <div className="h-5 w-12 rounded-full bg-[var(--muted)] max-[480px]:col-start-3 max-[480px]:row-start-1" />
      <div className="h-4 w-10 rounded-sm bg-[var(--muted)] justify-self-end max-[480px]:col-start-1 max-[480px]:col-span-3 max-[480px]:row-start-2 max-[480px]:justify-self-start" />
      <div className="h-4 w-10 rounded-sm bg-[var(--muted)] justify-self-end max-[480px]:hidden" />
      <div className="h-4 w-10 rounded-sm bg-[var(--muted)] justify-self-end max-[480px]:hidden" />
      <div className="h-4 w-16 rounded-sm bg-[var(--muted)] justify-self-end max-[480px]:hidden" />
    </motion.li>
  );
}
