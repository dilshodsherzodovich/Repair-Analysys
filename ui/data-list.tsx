"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DataListItem {
  id: string
  content: React.ReactNode
  actions?: React.ReactNode
  selected?: boolean
  disabled?: boolean
}

export interface DataListProps {
  items: DataListItem[]
  onItemClick?: (item: DataListItem) => void
  onSelectionChange?: (selectedIds: string[]) => void
  selectable?: boolean
  className?: string
  emptyState?: React.ReactNode
}

const DataList = React.forwardRef<HTMLDivElement, DataListProps>(
  ({ items = [], onItemClick, onSelectionChange, selectable = false, className, emptyState, ...props }, ref) => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

    if (!items) {
      items = []
    }

    const handleItemClick = (item: DataListItem) => {
      if (item.disabled) return

      if (selectable) {
        const newSelectedIds = new Set(selectedIds)
        if (newSelectedIds.has(item.id)) {
          newSelectedIds.delete(item.id)
        } else {
          newSelectedIds.add(item.id)
        }
        setSelectedIds(newSelectedIds)
        onSelectionChange?.(Array.from(newSelectedIds))
      }

      onItemClick?.(item)
    }

    if (items.length === 0 && emptyState) {
      return (
        <div ref={ref} className={cn("text-center py-12", className)} {...props}>
          {emptyState}
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              "flex items-center justify-between p-4 bg-white rounded-lg border transition-colors",
              !item.disabled && "hover:bg-[#f9fafb] cursor-pointer",
              item.disabled && "opacity-50 cursor-not-allowed",
              selectable && selectedIds.has(item.id) && "ring-2 ring-[#2354bf] bg-[#2354bf]/5",
            )}
          >
            <div className="flex-1 min-w-0">
              {selectable && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => {}}
                  className="mr-3 rounded border-[#d1d5db] text-[#2354bf] focus:ring-[#2354bf]"
                  disabled={item.disabled}
                />
              )}
              {item.content}
            </div>
            {item.actions && <div className="flex items-center space-x-2 ml-4">{item.actions}</div>}
          </div>
        ))}
      </div>
    )
  },
)
DataList.displayName = "DataList"

export { DataList }
