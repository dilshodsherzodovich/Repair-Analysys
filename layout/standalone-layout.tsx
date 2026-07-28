"use client";

import type React from "react";

/**
 * Chrome-less shell: no header, no sidebar. Supplies only what `MainLayout`'s
 * <main> would have — the scroll container, background and padding — plus the
 * `max-w-7xl` content width the passport is designed around.
 */
export function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background-secondary">
      <div className="mx-auto w-full max-w-7xl p-3 md:p-4">{children}</div>
    </div>
  );
}
