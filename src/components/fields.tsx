import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppText } from "@/components/primitives/AppText";
import { Box } from "@/components/primitives/Box";
import { FieldArea, FieldInput, FieldLabel, FieldSelect } from "@/components/primitives/Fields";

function FieldChrome({
  label,
  name,
  required = false,
  helper,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  name: string;
  required?: boolean;
  helper?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Box gap="sm" className={cn("w-full", className)}>
      {label ? (
        <Box direction="row" align="center" gap="xs">
          <FieldLabel htmlFor={name}>
            {label}
            {required ? (
              <AppText variant="small" tone="err" className="ml-0.5 inline">*</AppText>
            ) : null}
          </FieldLabel>
        </Box>
      ) : null}
      {children}
      {typeof error === "string" && error ? (
        <AppText variant="micro" tone="err">{error}</AppText>
      ) : null}
      {helper && !error ? (
        <AppText variant="micro" tone="muted">{helper}</AppText>
      ) : null}
    </Box>
  );
}

export type TextFieldProps = ComponentProps<typeof FieldInput> & {
  name: string;
  label?: ReactNode;
  required?: boolean;
  helper?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
};

export function TextField({
  name,
  label,
  required,
  helper,
  error,
  containerClassName,
  ...rest
}: TextFieldProps) {
  return (
    <FieldChrome name={name} label={label} required={required} helper={helper} error={error} className={containerClassName}>
      <FieldInput id={name} name={name} aria-invalid={Boolean(error)} {...rest} />
    </FieldChrome>
  );
}

export function TextAreaField({
  name,
  label,
  required,
  helper,
  error,
  containerClassName,
  ...rest
}: Omit<TextFieldProps, keyof ComponentProps<typeof FieldInput>> & ComponentProps<typeof FieldArea> & { name: string }) {
  return (
    <FieldChrome name={name} label={label} required={required} helper={helper} error={error} className={containerClassName}>
      <FieldArea id={name} name={name} aria-invalid={Boolean(error)} {...rest} />
    </FieldChrome>
  );
}

export function SelectField({
  name,
  label,
  required,
  helper,
  error,
  containerClassName,
  children,
  ...rest
}: Omit<TextFieldProps, keyof ComponentProps<typeof FieldInput>> & ComponentProps<typeof FieldSelect> & { name: string }) {
  return (
    <FieldChrome name={name} label={label} required={required} helper={helper} error={error} className={containerClassName}>
      <FieldSelect id={name} name={name} aria-invalid={Boolean(error)} {...rest}>
        {children}
      </FieldSelect>
    </FieldChrome>
  );
}
