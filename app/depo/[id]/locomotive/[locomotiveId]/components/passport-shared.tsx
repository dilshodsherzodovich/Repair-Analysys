"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Formatting helpers                                                        */
/* -------------------------------------------------------------------------- */

export const fmtNumber = (value?: number | null, suffix = ""): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${Math.round(value).toLocaleString("ru-RU")}${suffix}`;
};

export const fmtDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const fmtDateTime = (value?: string | number | null): string => {
  if (value === undefined || value === null || value === "") return "—";
  const d = new Date(typeof value === "string" ? value : Number(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export function EmptyBlock({
  icon: Icon,
  message,
}: {
  icon?: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
      {Icon && <Icon className="h-6 w-6 opacity-60" />}
      <span>{message}</span>
    </div>
  );
}

export function LoadingBlock({ label }: { label?: string }) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label ?? t("loading")}
    </div>
  );
}
