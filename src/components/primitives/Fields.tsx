import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Raw form elements live here and only here.
 * Features compose TextField / SelectField — never these directly,
 * and never raw <input>/<textarea>/<select>.
 */
const fieldShell =
  "w-full bg-raised text-ink text-[14px] rounded-md border border-field outline-none transition-colors placeholder:text-ink-faint focus:border-accent disabled:cursor-not-allowed disabled:opacity-50";

export function FieldInput({ className, ref, ...rest }: ComponentProps<"input"> & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...rest} className={cn(fieldShell, "h-12 px-3.5", className)} />;
}

export function FieldArea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={cn(fieldShell, "min-h-[120px] p-3.5 resize-y", className)} />;
}

export function FieldSelect({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select {...rest} className={cn(fieldShell, "h-12 px-3.5 appearance-none cursor-pointer", className)}>
      {children}
    </select>
  );
}

/** The only <label> in the system. */
export function FieldLabel({
  children,
  htmlFor,
  className,
}: {
  children?: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("text-[13px] font-medium text-ink", className)}>
      {children}
    </label>
  );
}
