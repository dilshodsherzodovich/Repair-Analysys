import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-white hover:bg-primary/80",
        default:
          "border-transparent bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]",
        outline: "text-[#374151] border-[#d1d5db]",
        secondary: "border-transparent bg-[#6b7280] text-white",
        secondary_outline:
          "border-transparent border-[#6b7280] bg-[#6b7280] text-white hover:bg-[#555e70]",
        destructive:
          "border-transparent bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        destructive_outline:
          "border-transparent border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#b91c1c]/20 hover:text-[#b91c1c]",
        success:
          "border-transparent bg-[#10b981] text-white hover:bg-[#059669]",
        success_outline:
          "border-transparent border-[#10b981] bg-[#10b981]/10 text-[#10b981] hover:bg-[#059669]/20 hover:text-[#059669]",
        warning:
          "border-transparent bg-[#f59e0b] text-white hover:bg-[#d97706]",
        warning_outline:
          "border-transparent border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 hover:text-[#d97706]",
        info: "border-transparent bg-[#2354bf] text-white hover:bg-[#1d4ed8]",
        info_outline:
          "border-transparent border-[#2354bf] bg-[#2354bf] text-white hover:bg-[#1d4ed8]",
      },
    },
    defaultVariants: {
      variant: "default",
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
