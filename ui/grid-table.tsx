import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dense bordered table for measurements (bandages, crankshaft, ...): outline
 * in border-strong, header on surface-muted, every cell draws its own
 * right/bottom line. border-separate (not collapse) so the lines stay with the
 * sticky header and pinned columns.
 */
export const gridHeadClass =
  "py-3 px-3 bg-surface-muted text-foreground-secondary font-medium border-r border-b border-border whitespace-nowrap";
export const gridCellClass =
  "py-2.5 px-3 border-r border-b border-border whitespace-nowrap";

/** Shadow for the last pinned column, so scrolled cells read as sliding under it. */
export const gridPinnedEdgeClass = "shadow-pin-start";

export function GridTable({
  maxHeight = "75vh",
  className,
  children,
}: {
  /** Height the table scrolls within; the header stays pinned. "none" to grow. */
  maxHeight?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-border-strong bg-background",
        className,
      )}
      style={{ maxHeight }}
    >
      <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

/**
 * Pins a column on horizontal scroll. `left` is the sum of the widths of the
 * pinned columns before it. Pinned cells need a solid background.
 */
export function stickyCol(left: number, width: number) {
  return {
    className: "sticky z-[5]",
    style: { left, width, minWidth: width, maxWidth: width } as React.CSSProperties,
  };
}
