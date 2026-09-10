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
