import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex w-full min-w-0 rounded-md border border-gray-300 bg-white",
        "min-h-16 px-3 py-1.5 text-sm sm:min-h-20 sm:px-4 sm:py-2 sm:text-sm",
        "transition-colors outline-none",
        "focus:border-blue-500 focus:ring-0 hover:border-gray-400",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "aria-invalid:border-red-500 aria-invalid:focus:border-red-500",
        "mb-3 sm:mb-4",
        "resize-y",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
