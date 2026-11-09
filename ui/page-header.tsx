"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  /** Before the title, e.g. a Back button. */
  leading?: React.ReactNode;
  className?: string;
  /** Override the description visibility. Hidden below `lg` by default. */
  descriptionClassName?: string;
  /**
   * `page` (default): large title on the page. `card`: a bordered card with an
   * icon tile, compact title, actions, and an optional filters strip and body;
   * used by report pages.
   */
  variant?: "page" | "card";
  /** Icon shown in the card variant's tile. */
  icon?: React.ElementType;
  /** Card variant: strip under the title row, for report filters. */
  filters?: React.ReactNode;
  /** Card variant: content below the filters, inside the same card. */
  children?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      breadcrumbs,
      actions,
      leading,
      className,
      descriptionClassName,
      variant = "page",
      icon: Icon,
      filters,
      children,
      ...props
    },
    ref
  ) => {
    if (variant === "card") {
      return (
        <div
          ref={ref}
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-background shadow-sm",
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-between gap-4 border-b border-muted px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                  <Icon className="size-4 text-primary-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-tight text-foreground">
                  {title}
                </h1>
                {description && (
                  <div
                    className={cn(
                      "mt-0.5 text-xs text-foreground-subtle",
                      descriptionClassName
                    )}
                  >
                    {description}
                  </div>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            )}
          </div>
          {filters && (
            <div className="flex flex-wrap items-end gap-2 bg-surface-muted/60 px-5 py-3">
              {filters}
            </div>
          )}
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("bg-transparent", className)} {...props}>
        <div className="py-2 md:py-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground mb-2 md:mb-4 flex-wrap">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  )}
                  {item.href && !item.current ? (
                    <a
                      href={item.href}
                      className="hover:text-primary transition-colors truncate max-w-[40vw]"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={cn(
                        "truncate max-w-[55vw]",
                        item.current && "text-foreground font-medium"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          <div className="flex items-start justify-between gap-3">
            {leading && <div className="flex shrink-0 items-center">{leading}</div>}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight md:mb-1 truncate">
                {title}
              </h1>
              {description && (
                <p
                  className={cn(
                    "hidden lg:block text-sm text-muted-foreground",
                    descriptionClassName
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
