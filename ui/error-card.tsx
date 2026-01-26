import { Card } from "@/ui/card";
import { Button } from "@/ui/button";
import { FileX, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
  retryLabel?: string;
  showRetry?: boolean;
  showBack?: boolean;
  className?: string;
  variant?: "error" | "not-found" | "warning";
}

export function ErrorCard({
  title,
  message,
  onRetry,
  backHref = "/",
  backLabel = "Orqaga qaytish",
  retryLabel = "Qayta yuklash",
  showRetry = true,
  showBack = true,
  className,
  variant = "error",
}: ErrorCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          iconBg: "bg-red-50",
          iconColor: "text-red-500",
          icon: FileX,
        };
      case "not-found":
        return {
          iconBg: "bg-gray-50",
          iconColor: "text-gray-400",
          icon: FileX,
        };
      case "warning":
        return {
          iconBg: "bg-yellow-50",
          iconColor: "text-yellow-500",
          icon: FileX,
        };
      default:
        return {
          iconBg: "bg-red-50",
          iconColor: "text-red-500",
          icon: FileX,
        };
    }
  };

  const { iconBg, iconColor, icon: Icon } = getVariantStyles();

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Card className={cn("p-8 max-w-md w-full text-center", className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className={cn("p-4 rounded-full", iconBg)}>
            <Icon className={cn("h-8 w-8", iconColor)} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
          <div className="flex gap-3">
            {showRetry && onRetry && (
              <Button
                variant="outline"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                {retryLabel}
              </Button>
            )}
            {showBack && backHref && (
              <Button asChild>
                <Link href={backHref} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
