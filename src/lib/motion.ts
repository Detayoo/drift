/**
 * Motion language. Every animation in the product speaks from these
 * values — nothing invents its own duration, easing, or distance.
 *
 * - Durations: micro 150ms (hovers, presses, fades), entrance 200ms,
 *   overlays 300ms, sheets 450ms spring. Nothing lasts longer.
 * - Easing: easeOut everywhere (decelerate into place, never linger);
 *   springs only for entrances on important surfaces, never on hover.
 * - Distance: entrances travel 8–10px max. Motion whispers.
 * - Interruption: every overlay that mounts animates out too
 *   (AnimatePresence with a mirrored exit). Nothing blinks away.
 * - Reduced motion: the global CSS kill-switch flattens CSS motion;
 *   MotionConfig reducedMotion="user" (see Providers) does the same
 *   for everything below. Keep fades, drop movement.
 */
export const MOTION = {
  micro: { duration: 0.15, ease: "easeOut" as const },
  entrance: { duration: 0.2, ease: "easeOut" as const },
  overlay: { duration: 0.3, ease: "easeOut" as const },
  sheet: { type: "spring" as const, bounce: 0.15, duration: 0.45 },
  modal: { type: "spring" as const, bounce: 0, duration: 0.3 },
  press: { scale: 0.96 },
} as const;

export const ENTER = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
} as const;

export const POP = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 8 },
} as const;

export const SETTLE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;
