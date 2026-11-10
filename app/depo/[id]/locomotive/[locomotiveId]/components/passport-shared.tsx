"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState, LoadingState } from "@/ui/empty-state";
import { formatNumber, formatDate, formatDateTime } from "@/lib/format";
/* -------------------------------------------------------------------------- */
/*  Formatting helpers                                                        */
/* -------------------------------------------------------------------------- */

export const fmtNumber = (value?: number | null, suffix = ""): string => {
  return formatNumber(value, { suffix });
};

export const fmtDate = (value?: string | null): string => formatDate(value);

export const fmtDateTime = (value?: string | number | null): string => formatDateTime(value);

/* -------------------------------------------------------------------------- */
/*  Section card — the standard framed block used across every passport tab   */
/* -------------------------------------------------------------------------- */

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  loading,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("gap-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {action}
        </div>
      </div>
      {children}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small key/value row                                                       */
/* -------------------------------------------------------------------------- */

export function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-border/70 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty / error placeholders                                                */
/* -------------------------------------------------------------------------- */

/** Passport sections use the kit states, compact, with the section's icon. */
export function EmptyBlock({
  icon: Icon,
  message,
}: {
  icon?: LucideIcon;
  message: string;
}) {
  return <EmptyState size="compact" title={message} icon={Icon ? <Icon className="size-5" /> : undefined} />;
}

export function LoadingBlock({ label }: { label?: string }) {
  return <LoadingState size="compact" shape="lines" label={label} />;
}
