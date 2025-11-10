import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Main Pagination component with react-paginate like functionality
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPreviousNext?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  previousLabel?: string;
  nextLabel?: string;
  firstLabel?: string;
  lastLabel?: string;
  className?: string;
  disabled?: boolean;
  totalItems?: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext = true,
  maxVisiblePages = 5,
  className,
  disabled = false,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getResultsRange = () => {
    const start = currentPage * 10 - 9;
    const end = totalItems ? Math.min(start + 9, totalItems) : start + 9;
    return `${start} - ${end}`;
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }
    if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn(
        "mx-auto flex w-full justify-between items-center mt-4",
        className
      )}
    >
      <div className="text-sm text-gray-500">
        {totalItems && (
          <span>
            {totalItems} ta natijadan{" "}
            <span className="font-bold text-primary">{getResultsRange()}</span>
          </span>
        )}
      </div>
      <ul className="flex flex-row items-center gap-1">
        {/* Previous button */}
        {showPreviousNext && currentPage > 1 && (
          <li>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              disabled={disabled}
            />
          </li>
        )}

        {/* Page numbers */}
        {visiblePages.map((page, index) => (
          <li key={index}>
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => onPageChange(page as number)}
                disabled={disabled}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </PaginationLink>
            )}
          </li>
        ))}

        {/* Next button */}
        {showPreviousNext && currentPage < totalPages && (
          <li>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              disabled={disabled}
            />
          </li>
        )}
      </ul>
    </nav>
  );
}

// Individual component exports (for custom usage)
function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
} & React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  disabled,
  onClick,
  children,
  ...props
}: PaginationLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      data-disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center cursor-pointer",
        "h-9 w-9 rounded-md text-sm font-medium",
        "border border-gray-200 bg-white",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-primary text-white border-primary"
          : "text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

function PaginationPrevious({
  className,
  disabled,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Go to previous page"
      className={cn(
        "inline-flex items-center justify-center cursor-pointer",
        "h-9 w-9 rounded-md text-sm font-medium",
        "border border-gray-200 bg-white text-gray-500",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "hover:bg-gray-50 hover:border-gray-300",
        "disabled:pointer-events-none disabled:opacity-50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </button>
  );
}

function PaginationNext({
  className,
  disabled,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Go to next page"
      className={cn(
        "inline-flex items-center justify-center cursor-pointer",
        "h-9 w-9 rounded-md text-sm font-medium",
        "border border-gray-200 bg-white text-gray-500",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "hover:bg-gray-50 hover:border-gray-300",
        "disabled:pointer-events-none disabled:opacity-50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <ChevronRightIcon className="h-4 w-4" />
    </button>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "inline-flex items-center justify-center",
        "h-9 w-9 rounded-md text-sm font-medium",
        "border border-gray-200 bg-white text-gray-500",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
