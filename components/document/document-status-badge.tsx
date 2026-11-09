"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge, type BadgeProps } from "@/ui/badge"
import { CheckCircle, Clock, Archive, FileText } from "lucide-react"

export interface DocumentStatusBadgeProps {
  status: "draft" | "review" | "approved" | "archived"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

const STATUS: Record<
  DocumentStatusBadgeProps["status"],
  { label: string; icon: React.ReactNode; variant: BadgeProps["variant"] }
> = {
  approved: { label: "Утверждено", icon: <CheckCircle className="size-3" />, variant: "success_solid" },
  review: { label: "На рассмотрении", icon: <Clock className="size-3" />, variant: "warning_solid" },
  archived: { label: "Архивировано", icon: <Archive className="size-3" />, variant: "neutral_solid" },
  draft: { label: "Черновик", icon: <FileText className="size-3" />, variant: "neutral" },
}

const SIZES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-2 text-sm",
}

function DocumentStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: DocumentStatusBadgeProps) {
  const config = STATUS[status] ?? STATUS.draft

  return (
    <Badge variant={config.variant} className={cn("font-medium", SIZES[size], className)}>
      {showIcon && config.icon}
      {config.label}
    </Badge>
  )
}

export { DocumentStatusBadge }
