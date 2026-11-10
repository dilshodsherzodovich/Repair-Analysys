import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Root of every page: its sections (PageHeader, content cards, tables) stacked
 * 24px apart. The app layout already pads the page and paints the background,
 * so sections add no outer padding or margins of their own.
 */
export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}
