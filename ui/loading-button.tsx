import { Loader2 } from "lucide-react";
import { Button } from "./button";
import React from "react";
import { cn } from "@/lib/utils";

export function LoadingButton({
  children,
  isPending,
  ...props
}: React.ComponentProps<typeof Button> & { isPending: boolean }) {
  return (
    <Button
      {...props}
      disabled={isPending}
      className={cn(
        "flex items-center justify-center min-w-24",
        props.className
      )}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  );
}
