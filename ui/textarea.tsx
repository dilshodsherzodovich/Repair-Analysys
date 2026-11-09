import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-foreground-subtle selection:bg-primary selection:text-primary-foreground",
        "flex w-full min-w-0 rounded-md border border-border-strong bg-background text-foreground",
        "min-h-16 px-3 py-1.5 text-sm sm:min-h-20 sm:px-4 sm:py-2 sm:text-sm",
        "transition-colors outline-none",
        "focus:border-primary focus:ring-0 hover:border-foreground-subtle",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
        "aria-invalid:border-destructive aria-invalid:focus:border-destructive",
        "mb-3 sm:mb-4",
        "resize-y",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
