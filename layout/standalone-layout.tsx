"use client";

import type React from "react";
import { cn } from "@/lib/utils";

/**
 * Chrome-less shell: no header, no sidebar. Supplies only what `MainLayout`'s
 * <main> would have — the scroll container, background and padding — plus the
 * `max-w-7xl` content width the passport is designed around.
 *
 * `fullWidth` drops that cap for pages meant to fill their window, such as a
 * single component group opened in its own window.
 */
export function StandaloneLayout({
  children,
  fullWidth = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background-secondary">
      <div
        className={cn("mx-auto w-full p-3 md:p-4", !fullWidth && "max-w-7xl")}
      >
        {children}
      </div>
    </div>
  );
}
