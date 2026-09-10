import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Box } from "./Box";

/** Page-width shell. Desktop max 1440px, fluid gutters that tighten downward. */
export function Container({
  children,
  className,
  narrow = false,
}: {
  children?: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <Box
      className={cn(
        "mx-auto w-full px-8 max-lg:px-6 max-md:px-4",
        narrow ? "max-w-[960px]" : "max-w-[1440px]",
        className,
      )}
    >
      {children}
    </Box>
  );
}

/** The only <main> in the system. */
export function Main({ children, className }: { children?: ReactNode; className?: string }) {
  return <main className={cn("flex min-h-full flex-1 flex-col", className)}>{children}</main>;
}

/** The only <section> in the system. */
export function Section({
  children,
  className,
  label,
}: {
  children?: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section aria-label={label} className={cn("flex flex-col", className)}>
      {children}
    </section>
  );
}

/** The only <header> in the system. */
export function AppHeader({ children, className }: { children?: ReactNode; className?: string }) {
  return <header className={cn("flex flex-col", className)}>{children}</header>;
}

/** The only <footer> in the system. */
export function AppFooter({ children, className }: { children?: ReactNode; className?: string }) {
  return <footer className={cn("flex flex-col", className)}>{children}</footer>;
}

/** Hairline rule. Elevation elsewhere is always a border, never a shadow. */
export function Divider({ className }: { className?: string }) {
  return <Box role="separator" className={cn("border-t border-line", className)} />;
}
