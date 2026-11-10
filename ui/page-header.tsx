"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  /** One meta line under the title: org · period · "as of" time, count, ... */
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Page actions (view switch, Add, ...) then ExportActions. With `filters`
   * they sit at the right of the filter card; without, next to the title.
   */
  actions?: React.ReactNode;
  /** Before the title, e.g. a Back button. */
  leading?: React.ReactNode;
  /** The page's FilterBar, shown in the filter card under the header. */
  filters?: React.ReactNode;
}

/** The card that holds a FilterBar; shared by PageHeader and FilterPanel. */
export const FILTER_CARD =
  "rounded-xl border border-border bg-background px-4 py-3 shadow-sm";

/**
 * Where a FilterBar inside the card puts its active-filter chips: a line
 * under the controls and actions, shown only while it has something.
 */
export const FilterCardFooter = React.createContext<HTMLElement | null>(null);

/**
 * The filter card: one toolbar line with the filters on the left and the
 * page's actions on the right (view switch, secondary actions, then the
 * primary one), and under it the active-filter chips when any are set.
 * Every page's filters and actions live here, never split between the
 * header and the card.
 */
export function FilterCard({
  children,
  actions,
  className,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const [footer, setFooter] = React.useState<HTMLDivElement | null>(null);
  return (
    <div className={cn(FILTER_CARD, className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        {children && (
          <div className="min-w-0 flex-1">
            <FilterCardFooter.Provider value={footer}>{children}</FilterCardFooter.Provider>
          </div>
        )}
        {actions && (
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
      <div ref={setFooter} className="empty:hidden mt-3 border-t border-border pt-3" />
    </div>
  );
}

/**
 * The header every page uses (see "Page standards" in the design-system
 * spec): breadcrumbs, the title with one meta line and the actions on the
 * right, and under it the page's filters in the filter card (which then
 * holds the actions too).
 */
const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    { title, description, breadcrumbs, actions, leading, filters, className, ...props },
    ref
  ) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <div className="space-y-2">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="size-3 shrink-0" />}
                {item.href && !item.current ? (
                  <a
                    href={item.href}
                    className="max-w-[40vw] truncate transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={cn(
                      "max-w-[55vw] truncate",
                      item.current && "font-medium text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-start gap-3">
            {leading && <div className="flex shrink-0 items-center">{leading}</div>}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold leading-tight text-foreground md:text-2xl">
                {title}
              </h1>
              {description && (
                <div className="mt-1 truncate text-sm text-muted-foreground">{description}</div>
              )}
            </div>
          </div>
          {actions && !filters && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      </div>

      {filters && <FilterCard actions={actions}>{filters}</FilterCard>}
    </div>
  )
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
