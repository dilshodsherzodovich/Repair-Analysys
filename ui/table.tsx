"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one table look (see "Tables" in the design-system spec). The table owns
 * every visual decision: header on surface-muted with small secondary text,
 * cell padding, lines. A page chooses only:
 *  - `bordered`: full cell grid (report matrices); default is row lines only
 *  - `density`: "compact" for wide / dense matrices
 *  - `frame`: the rounded outlined box that scrolls the table, with an
 *    optional `maxHeight` so the header stays pinned
 * Cells keep only content decisions: alignment, width, pinning, and status
 * highlights (e.g. bg-destructive-subtle).
 */
type Density = "default" | "compact";

const TableContext = React.createContext<{ bordered: boolean; density: Density }>({
  bordered: false,
  density: "default",
});

const PADDING: Record<Density, string> = {
  default: "px-3 py-2.5 text-sm",
  compact: "px-2 py-1.5 text-xs",
};

function Table({
  className,
  wrapper = true,
  frame = false,
  maxHeight,
  bordered = false,
  density = "default",
  ...props
}: React.ComponentProps<"table"> & {
  /**
   * Plain horizontal scroll container (no outline). Pass false when the table
   * sits in a scroll frame of its own; a second scroll container breaks
   * position: sticky.
   */
  wrapper?: boolean;
  /** The outlined, rounded scroll box. */
  frame?: boolean;
  /** With `frame`: the height the table scrolls within (header stays pinned). */
  maxHeight?: string;
  bordered?: boolean;
  density?: Density;
}) {
  const table = (
    <TableContext.Provider value={{ bordered, density }}>
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-separate border-spacing-0", className)}
        {...props}
      />
    </TableContext.Provider>
  );
  if (frame) {
    return (
      <div
        data-slot="table-frame"
        className="overflow-auto rounded-lg border border-border-strong bg-background"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {table}
      </div>
    );
  }
  if (!wrapper) return table;
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      {table}
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    // Header rows don't take the body rows' hover tint
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-surface-muted font-semibold [&_td]:text-foreground", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors hover:bg-surface-muted/70 data-[state=selected]:bg-primary-subtle",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const { bordered, density } = React.useContext(TableContext);
  return (
    <th
      data-slot="table-head"
      className={cn(
        "bg-surface-muted text-left align-middle font-medium whitespace-nowrap text-foreground-secondary",
        "border-b border-border",
        bordered && "border-r last:border-r-0",
        PADDING[density],
        density === "default" && "text-xs",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const { bordered, density } = React.useContext(TableContext);
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle text-foreground border-b border-border",
        bordered && "border-r last:border-r-0",
        PADDING[density],
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
