import { motion } from "motion/react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";

type ActionButtonProps = Omit<ComponentProps<typeof motion.button>, "children"> & {
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * The only <button> in the system (via motion.button).
 * Unstyled press-feedback base — features use AppButton / IconButton.
 */
export function ActionButton({ children, className, type = "button", ref, ...rest }: ActionButtonProps) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={MOTION.press}
      {...rest}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center outline-none select-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
