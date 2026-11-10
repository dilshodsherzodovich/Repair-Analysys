import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status pills (see "Badges" in the design-system spec). Statuses use the
 * subtle variants (neutral, primary, success, warning, danger); the solid
 * ones are for counts and strong emphasis. `size="sm"` for pills inside
 * dense table cells.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-transparent font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Subtle: light fill, coloured text
        neutral: "bg-muted text-foreground-secondary",
        primary: "bg-primary-subtle text-primary",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger: "bg-destructive-subtle text-destructive",

        // Solid: filled, white text
        neutral_solid: "bg-muted-foreground text-primary-foreground",
        primary_solid: "bg-primary text-primary-foreground",
        success_solid: "bg-success text-success-foreground",
        warning_solid: "bg-warning text-warning-foreground",
        danger_solid: "bg-destructive text-destructive-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-2xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
