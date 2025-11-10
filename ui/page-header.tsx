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
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, breadcrumbs, actions, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("bg-transparent", className)} {...props}>
        <div className="px-6 py-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-[#6b7280] mb-4">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-4 h-4" />}
                  {item.href && !item.current ? (
                    <a
                      href={item.href}
                      className="hover:text-[#2354bf] transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={cn(
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1f2937] mb-1">
                {title}
              </h1>
              {description && <p className="text-[#6b7280]">{description}</p>}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">{actions}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
