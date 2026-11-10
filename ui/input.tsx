import type * as React from "react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  /** Form field: 36/40px tall, spacing below for stacked forms. */
  default: "h-9 px-3 py-1.5 text-sm sm:h-10 sm:px-4 sm:py-2 sm:text-sm mb-3 sm:mb-4",
  /** Toolbars, filters, dropdown search boxes and dense forms: 32px, no margin. */
  compact: "h-8 px-2.5 py-1 text-sm",
  /** Editor inside a table / grid cell: fills the cell, no chrome until focused. */
  cell:
    "h-full rounded-none border-0 bg-transparent px-2 text-xs hover:border-0 focus:bg-background focus:ring-2 focus:ring-inset focus:ring-primary/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
} as const;

function Input({
  className,
  name,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & { variant?: keyof typeof VARIANTS }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      name={name}
      className={cn(
        "file:text-foreground placeholder:text-foreground-subtle selection:bg-primary selection:text-primary-foreground",
        "flex w-full min-w-0 rounded-md border border-border-strong bg-background text-foreground",
        "transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus:border-primary focus:ring-0 hover:border-foreground-subtle",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
        "aria-invalid:border-destructive aria-invalid:focus:border-destructive",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

export { Input };
