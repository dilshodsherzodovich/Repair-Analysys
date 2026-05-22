"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
  /** Override the description visibility. Hidden below `lg` by default. */
  descriptionClassName?: string;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      breadcrumbs,
      actions,
      className,
      descriptionClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("bg-transparent", className)} {...props}>
        <div className="py-2 md:py-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-[#6b7280] mb-2 md:mb-4 flex-wrap">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  )}
                  {item.href && !item.current ? (
                    <a
                      href={item.href}
                      className="hover:text-[#2354bf] transition-colors truncate max-w-[40vw]"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={cn(
                        "truncate max-w-[55vw]",
                        item.current && "text-[#1f2937] font-medium"
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
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-[#1f2937] leading-tight md:mb-1 truncate">
                {title}
              </h1>
              {description && (
                <p
                  className={cn(
                    "hidden lg:block text-sm text-[#6b7280]",
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
