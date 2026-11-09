import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status pills. Use the subtle variants (neutral, primary, success, warning,
 * danger) by default; the solid ones are for counts and strong emphasis.
 * The *_outline names are older aliases of the subtle variants.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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

        outline: "border-border-strong text-foreground-secondary",

        // Older names, kept so existing pages keep working
        default: "bg-muted text-foreground-secondary",
        secondary: "bg-muted-foreground text-primary-foreground",
        secondary_outline: "bg-muted-foreground text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        destructive_outline: "bg-destructive-subtle text-destructive",
        success_outline: "bg-success-subtle text-success",
        warning_outline: "bg-warning-subtle text-warning",
        info: "bg-primary text-primary-foreground",
        info_outline: "bg-primary-subtle text-primary",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
