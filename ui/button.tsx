import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        /** Main action of a screen or dialog. */
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        /** Bordered, white: secondary actions next to a primary one. */
        outline:
          "border border-border-strong bg-background text-foreground shadow-xs hover:border-primary hover:text-primary",
        /** Filled grey: low-emphasis actions. */
        secondary:
          "bg-muted text-foreground hover:bg-border",
        /** No chrome: toolbar and inline actions. */
        ghost: "text-foreground-secondary hover:bg-muted hover:text-foreground",
        /** Delete and other irreversible actions. */
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
        /** Bordered red: reset / remove actions that should not shout. */
        "outline-destructive":
          "border border-destructive/40 bg-background text-destructive shadow-xs hover:bg-destructive-subtle",
        /** Bordered green: confirm / add actions next to neutral ones. */
        "outline-success":
          "border border-success/40 bg-background text-success shadow-xs hover:bg-success-subtle",
        /** Bordered amber: secondary actions that need attention. */
        "outline-warning":
          "border border-warning/40 bg-background text-warning shadow-xs hover:bg-warning-subtle",
        /** Positive actions such as the Excel export. */
        success:
          "bg-success text-success-foreground shadow-xs hover:bg-success/90 focus-visible:ring-success/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 px-3 py-1.5 text-xs sm:h-10 sm:px-4 sm:py-2 sm:text-sm has-[>svg]:px-3",
        xs: "h-7 rounded-md gap-1 px-2 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        md: "h-10 rounded-md px-4 has-[>svg]:px-3",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        /** Small icon action inside rows and cells (edit, delete, settings). */
        "icon-sm": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner and blocks clicks while an action runs. */
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Slot needs a single child, so asChild buttons skip the spinner */}
      {loading && !asChild && <Loader2 className="animate-spin" />}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
