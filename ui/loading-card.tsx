import { Card } from "@/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LoadingCardProps {
  breadCrumbs?: {
    label: string;
    href: string;
  }[];
  title?: string;
  showHeader?: boolean;
  showTable?: boolean;
  rows?: number;
  className?: string;
  variant?: "page" | "table" | "simple";
}

export function LoadingCard({
  breadCrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Klassifikator", href: "/classificators" },
  ],
  title = "Yuklanmoqda...",
  showHeader = true,
  showTable = true,
  rows = 5,
  className,
  variant = "page",
}: LoadingCardProps) {
  if (variant === "simple") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className={cn("p-8 max-w-md w-full text-center", className)}>
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <Card className={cn("p-6", className)}>
        <div className="space-y-4">
          {/* Filter bar skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-10 w-80 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Table skeleton */}
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            {[...Array(rows)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Default page variant
  return (
    <div className={cn("space-y-6", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-[#6b7280] mb-2">
              {breadCrumbs.map((breadcrumb, index) => (
                <span key={index}>
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                  {index < breadCrumbs.length - 1 && <span>›</span>}
                </span>
              ))}
              <span>›</span>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      )}

      {showTable && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Filter bar skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-10 w-80 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Table skeleton */}
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              {[...Array(rows)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
