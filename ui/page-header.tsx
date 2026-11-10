"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageIcon } from "@/lib/page-icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  /** One meta line: org · period · "as of" time, record count, ... */
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Page actions (Add, ...) then ExportActions, right-aligned. */
  actions?: React.ReactNode;
  /** Before the icon, e.g. a Back button. */
  leading?: React.ReactNode;
  /** Overrides the page icon looked up from the route (lib/page-icons). */
  icon?: React.ElementType;
  /** The page's FilterBar, shown in a strip at the bottom of the card. */
  filters?: React.ReactNode;
  /** Extra content inside the card, below the filters. */
  children?: React.ReactNode;
}

/**
 * The header every page uses (see "Page standards" in the design-system
 * spec): a card with the page icon, title, one meta line and actions, and the
 * page's FilterBar in a strip underneath.
 */
const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      breadcrumbs,
      actions,
      leading,
      icon,
      filters,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();
    const Icon = icon ?? pageIcon(pathname ?? "");

    return (
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

        <div
          ref={ref}
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-background shadow-sm",
            className
          )}
          {...props}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              {leading && <div className="flex shrink-0 items-center">{leading}</div>}
              {Icon && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                  <Icon className="size-4 text-primary-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold leading-tight text-foreground">
                  {title}
                </h1>
                {description && (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {description}
                  </div>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
          {filters && (
            <div className="border-t border-border bg-surface-muted/60 px-5 py-3">
              {filters}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
