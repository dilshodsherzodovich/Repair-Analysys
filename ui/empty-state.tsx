"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-center py-12 flex flex-col items-center justify-center",
          className
        )}
        {...props}
      >
        {icon && <div className="mx-auto mb-4 text-[#9ca3af]">{icon}</div>}
        <h3 className="text-lg font-medium text-[#1f2937] mb-2">{title}</h3>
        {description && (
          <p className="text-[#6b7280] mb-6 max-w-md mx-auto">{description}</p>
        )}
        {action && <div>{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
