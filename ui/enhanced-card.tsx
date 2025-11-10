"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { MoreVertical, ExternalLink } from "lucide-react"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-white text-[#1f2937] shadow-sm", className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-[#6b7280]", className)} {...props} />,
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
)
CardFooter.displayName = "CardFooter"

// Enhanced Card Variants
export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    direction: "up" | "down" | "neutral"
  }
  icon?: React.ReactNode
  className?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, description, trend, icon, className, ...props }, ref) => {
    const getTrendColor = (direction: "up" | "down" | "neutral") => {
      switch (direction) {
        case "up":
          return "text-[#10b981]"
        case "down":
          return "text-[#ff5959]"
        default:
          return "text-[#6b7280]"
      }
    }

    return (
      <Card ref={ref} className={cn("hover:shadow-md transition-shadow", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#6b7280] mb-1">{title}</p>
              <p className="text-2xl font-bold text-[#1f2937] mb-1">{value}</p>
              {description && <p className="text-sm text-[#9ca3af]">{description}</p>}
              {trend && (
                <div className={cn("flex items-center mt-2 text-sm", getTrendColor(trend.direction))}>
                  <span className="font-medium">
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}%
                  </span>
                  <span className="ml-1 text-[#6b7280]">{trend.label}</span>
                </div>
              )}
            </div>
            {icon && <div className="text-[#2354bf] opacity-80">{icon}</div>}
          </div>
        </CardContent>
      </Card>
    )
  },
)
StatCard.displayName = "StatCard"

export interface DocumentCardProps {
  title: string
  description?: string
  fileType: string
  fileSize?: string
  lastModified?: string
  author?: string
  status?: "draft" | "review" | "approved" | "archived"
  thumbnail?: string
  onView?: () => void
  onDownload?: () => void
  onEdit?: () => void
  className?: string
}

const DocumentCard = React.forwardRef<HTMLDivElement, DocumentCardProps>(
  (
    {
      title,
      description,
      fileType,
      fileSize,
      lastModified,
      author,
      status = "draft",
      thumbnail,
      onView,
      onDownload,
      onEdit,
      className,
      ...props
    },
    ref,
  ) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "approved":
          return "bg-[#10b981] text-white"
        case "review":
          return "bg-[#f59e0b] text-white"
        case "archived":
          return "bg-[#6b7280] text-white"
        default:
          return "bg-[#e5e7eb] text-[#374151]"
      }
    }

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "approved":
          return "Утверждено"
        case "review":
          return "На рассмотрении"
        case "archived":
          return "Архивировано"
        default:
          return "Черновик"
      }
    }

    return (
      <Card ref={ref} className={cn("hover:shadow-md transition-shadow cursor-pointer", className)} {...props}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-[#1f2937] truncate mb-1">{title}</h4>
              {description && <p className="text-sm text-[#6b7280] line-clamp-2 mb-2">{description}</p>}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(status))}>
                {getStatusLabel(status)}
              </span>
              <button className="p-1 hover:bg-[#f3f4f6] rounded">
                <MoreVertical className="w-4 h-4 text-[#6b7280]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-[#6b7280] mb-3">
            <span className="font-medium">{fileType.toUpperCase()}</span>
            {fileSize && <span>{fileSize}</span>}
          </div>

          <div className="flex items-center justify-between text-xs text-[#9ca3af]">
            <div>
              {author && <span>Автор: {author}</span>}
              {lastModified && <span className="block mt-1">Изменено: {lastModified}</span>}
            </div>
            <div className="flex space-x-2">
              {onView && (
                <button onClick={onView} className="text-[#2354bf] hover:text-[#1e40af] flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Открыть
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)
DocumentCard.displayName = "DocumentCard"

// Enhanced Card Variants
export interface EnhancedCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    { title, description, children, actions, className, headerClassName, contentClassName, footerClassName, ...props },
    ref,
  ) => {
    return (
      <Card ref={ref} className={className} {...props}>
        {(title || description || actions) && (
          <CardHeader className={headerClassName}>
            <div className="flex items-center justify-between">
              <div>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center space-x-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent className={contentClassName}>{children}</CardContent>
      </Card>
    )
  },
)
EnhancedCard.displayName = "EnhancedCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard, DocumentCard, EnhancedCard }
