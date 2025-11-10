import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex min-h-20 w-full min-w-0 rounded-md border border-gray-300 bg-white px-4 py-2 text-base",
        "transition-colors outline-none",
        "focus:border-blue-500 focus:ring-0 hover:border-gray-400",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "aria-invalid:border-red-500 aria-invalid:focus:border-red-500",
        "mb-4", // Added margin bottom for spacing between form elements
        "md:text-sm",
        "resize-y", // Allow vertical resizing
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
