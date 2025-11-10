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
      <div ref={ref} className={cn("bg-white rounded-lg border p-6 space-y-6", className)} {...props}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1f2937] mb-2">{metadata.title}</h2>
            {metadata.description && <p className="text-[#6b7280] mb-4">{metadata.description}</p>}
          </div>
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", getStatusColor(metadata.status))}>
            {getStatusLabel(metadata.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#1f2937] border-b border-[#e5e7eb] pb-2">Основная информация</h3>

            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-[#6b7280]" />
              <div>
                <p className="text-sm text-[#6b7280]">Автор</p>
                <p className="font-medium text-[#1f2937]">{metadata.author}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-[#6b7280]" />
              <div>
                <p className="text-sm text-[#6b7280]">Тип файла</p>
                <p className="font-medium text-[#1f2937]">{metadata.type.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Tag className="w-4 h-4 text-[#6b7280]" />
              <div>
                <p className="text-sm text-[#6b7280]">Категория</p>
                <p className="font-medium text-[#1f2937]">{metadata.category}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#6b7280] rounded-full" />
              </div>
              <div>
                <p className="text-sm text-[#6b7280]">Размер</p>
                <p className="font-medium text-[#1f2937]">{metadata.size}</p>
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#1f2937] border-b border-[#e5e7eb] pb-2">Даты и статус</h3>

            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-[#6b7280]" />
              <div>
                <p className="text-sm text-[#6b7280]">Создано</p>
                <p className="font-medium text-[#1f2937]">{formatDate(metadata.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-[#6b7280]" />
              <div>
                <p className="text-sm text-[#6b7280]">Обновлено</p>
                <p className="font-medium text-[#1f2937]">{formatDate(metadata.updatedAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#2354bf] rounded-full" />
              </div>
              <div>
                <p className="text-sm text-[#6b7280]">Версия</p>
                <p className="font-medium text-[#1f2937]">{metadata.version}</p>
              </div>
            </div>

            {metadata.approver && metadata.approvedAt && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                <div>
                  <p className="text-sm text-[#6b7280]">Утверждено</p>
                  <p className="font-medium text-[#1f2937]">{metadata.approver}</p>
                  <p className="text-xs text-[#9ca3af]">{formatDate(metadata.approvedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {metadata.tags.length > 0 && (
          <div>
            <h3 className="font-medium text-[#1f2937] mb-3">Теги</h3>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-[#f3f4f6] text-[#374151] text-sm rounded-md border">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Department */}
        <div>
          <h3 className="font-medium text-[#1f2937] mb-2">Подразделение</h3>
          <p className="text-[#6b7280]">{metadata.department}</p>
        </div>
      </div>
    )
  },
)
DocumentMetadataComponent.displayName = "DocumentMetadata"
