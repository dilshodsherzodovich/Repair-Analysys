"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Download,
  Share2,
  Edit,
  Trash2,
  Copy,
  Archive,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  History,
} from "lucide-react";
import { EnhancedButton } from "@/ui/enhanced-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

export interface DocumentActionsProps {
  documentId: string;
  status: "draft" | "review" | "approved" | "archived";
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  canArchive?: boolean;
  canShare?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onArchive?: () => void;
  onViewHistory?: () => void;
  className?: string;
  variant?: "buttons" | "dropdown" | "mixed";
}

const DocumentActions = React.forwardRef<HTMLDivElement, DocumentActionsProps>(
  (
    {
      documentId,
      status,
      canEdit = false,
      canDelete = false,
      canApprove = false,
      canArchive = false,
      canShare = false,
      onView,
      onEdit,
      onDelete,
      onDownload,
      onShare,
      onDuplicate,
      onApprove,
      onReject,
      onArchive,
      onViewHistory,
      className,
      variant = "mixed",
      ...props
    },
    ref
  ) => {
    const primaryActions = [
      {
        key: "view",
        label: "Просмотр",
        icon: <Eye className="w-4 h-4" />,
        onClick: onView,
        show: !!onView,
        variant: "outline" as const,
      },
      {
        key: "edit",
        label: "Редактировать",
        icon: <Edit className="w-4 h-4" />,
        onClick: onEdit,
        show: canEdit && !!onEdit && status !== "archived",
        variant: "default" as const,
      },
      {
        key: "approve",
        label: "Утвердить",
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: onApprove,
        show: canApprove && !!onApprove && status === "review",
        variant: "success" as const,
      },
      {
        key: "reject",
        label: "Отклонить",
        icon: <XCircle className="w-4 h-4" />,
        onClick: onReject,
        show: canApprove && !!onReject && status === "review",
        variant: "destructive" as const,
      },
    ];

    const secondaryActions = [
      {
        key: "download",
        label: "Скачать",
        icon: <Download className="w-4 h-4" />,
        onClick: onDownload,
        show: !!onDownload,
      },
      {
        key: "share",
        label: "Поделиться",
        icon: <Share2 className="w-4 h-4" />,
        onClick: onShare,
        show: canShare && !!onShare,
      },
      {
        key: "duplicate",
        label: "Дублировать",
        icon: <Copy className="w-4 h-4" />,
        onClick: onDuplicate,
        show: !!onDuplicate,
      },
      {
        key: "history",
        label: "История версий",
        icon: <History className="w-4 h-4" />,
        onClick: onViewHistory,
        show: !!onViewHistory,
      },
      {
        key: "archive",
        label: status === "archived" ? "Восстановить" : "Архивировать",
        icon: <Archive className="w-4 h-4" />,
        onClick: onArchive,
        show: canArchive && !!onArchive,
      },
      {
        key: "delete",
        label: "Удалить",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: onDelete,
        show: canDelete && !!onDelete,
        destructive: true,
      },
    ];

    const visiblePrimaryActions = primaryActions.filter(
      (action) => action.show
    );
    const visibleSecondaryActions = secondaryActions.filter(
      (action) => action.show
    );

    if (variant === "buttons") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center space-x-2", className)}
          {...props}
        >
          {[...visiblePrimaryActions, ...visibleSecondaryActions].map(
            (action) => (
              <EnhancedButton
                key={action.key}
                size="sm"
                variant={action.variant || "outline"}
                onClick={action.onClick}
                leftIcon={action.icon}
                className={
                  action.destructive
                    ? "text-[#ff5959] hover:text-[#ff5959]"
                    : ""
                }
              >
                {action.label}
              </EnhancedButton>
            )
          )}
        </div>
      );
    }

    if (variant === "dropdown") {
      return (
        <div ref={ref} className={cn("", className)} {...props}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <EnhancedButton size="sm" variant="outline">
                <MoreVertical className="w-4 h-4" />
              </EnhancedButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {[...visiblePrimaryActions, ...visibleSecondaryActions].map(
                (action, index) => (
                  <React.Fragment key={action.key}>
                    {index === visiblePrimaryActions.length &&
                      visiblePrimaryActions.length > 0 && (
                        <DropdownMenuSeparator />
                      )}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      className={
                        action.destructive
                          ? "text-[#ff5959] focus:text-[#ff5959]"
                          : ""
                      }
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  </React.Fragment>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    // Mixed variant (default)
    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-2", className)}
        {...props}
      >
        {/* Primary actions as buttons */}
        {visiblePrimaryActions.map((action) => (
          <EnhancedButton
            key={action.key}
            size="sm"
            variant={action.variant}
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </EnhancedButton>
        ))}

        {/* Secondary actions in dropdown */}
        {visibleSecondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <EnhancedButton size="sm" variant="outline">
                <MoreVertical className="w-4 h-4" />
              </EnhancedButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {visibleSecondaryActions.map((action) => (
                <DropdownMenuItem
                  key={action.key}
                  onClick={action.onClick}
                  className={
                    action.destructive
                      ? "text-[#ff5959] focus:text-[#ff5959]"
                      : ""
                  }
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }
);
DocumentActions.displayName = "DocumentActions";

export { DocumentActions };
