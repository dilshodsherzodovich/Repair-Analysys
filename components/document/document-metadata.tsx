"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar, User, Tag, FileText, Clock, CheckCircle } from "lucide-react"

export interface DocumentMetadata {
  title: string
  description?: string
  author: string
  createdAt: string
  updatedAt: string
  version: string
  status: "draft" | "review" | "approved" | "archived"
  category: string
  tags: string[]
  size: string
  type: string
  department: string
  approver?: string
  approvedAt?: string
}

export interface DocumentMetadataProps {
  metadata: DocumentMetadata
  editable?: boolean
  onEdit?: (field: keyof DocumentMetadata, value: any) => void
  className?: string
}

const DocumentMetadataComponent = React.forwardRef<HTMLDivElement, DocumentMetadataProps>(
  ({ metadata, editable = false, onEdit, className, ...props }, ref) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "approved":
          return "bg-success text-success-foreground"
        case "review":
          return "bg-warning text-warning-foreground"
        case "archived":
          return "bg-muted-foreground text-primary-foreground"
        default:
          return "bg-border text-foreground-secondary"
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

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return (
      <div ref={ref} className={cn("bg-background rounded-lg border p-6 space-y-6", className)} {...props}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{metadata.title}</h2>
            {metadata.description && <p className="text-muted-foreground mb-4">{metadata.description}</p>}
          </div>
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", getStatusColor(metadata.status))}>
            {getStatusLabel(metadata.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground border-b border-border pb-2">Основная информация</h3>

            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Автор</p>
                <p className="font-medium text-foreground">{metadata.author}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Тип файла</p>
                <p className="font-medium text-foreground">{metadata.type.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Категория</p>
                <p className="font-medium text-foreground">{metadata.category}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Размер</p>
                <p className="font-medium text-foreground">{metadata.size}</p>
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground border-b border-border pb-2">Даты и статус</h3>

            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Создано</p>
                <p className="font-medium text-foreground">{formatDate(metadata.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Обновлено</p>
                <p className="font-medium text-foreground">{formatDate(metadata.updatedAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Версия</p>
                <p className="font-medium text-foreground">{metadata.version}</p>
              </div>
            </div>

            {metadata.approver && metadata.approvedAt && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Утверждено</p>
                  <p className="font-medium text-foreground">{metadata.approver}</p>
                  <p className="text-xs text-foreground-subtle">{formatDate(metadata.approvedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {metadata.tags.length > 0 && (
          <div>
            <h3 className="font-medium text-foreground mb-3">Теги</h3>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-muted text-foreground-secondary text-sm rounded-md border">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Department */}
        <div>
          <h3 className="font-medium text-foreground mb-2">Подразделение</h3>
          <p className="text-muted-foreground">{metadata.department}</p>
        </div>
      </div>
    )
  },
)
DocumentMetadataComponent.displayName = "DocumentMetadata"
