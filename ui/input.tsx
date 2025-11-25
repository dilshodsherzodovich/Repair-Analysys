import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  name,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      name={name}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex h-10 w-full min-w-0 rounded-md border border-gray-300 bg-white px-4 py-2 text-base",
        "transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus:border-blue-500 focus:ring-0 hover:border-gray-400",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "aria-invalid:border-red-500 aria-invalid:focus:border-red-500",
        "mb-4", // Added margin bottom for spacing between form elements
        "md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
