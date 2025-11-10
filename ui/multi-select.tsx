"use client";

import * as React from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search items...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [dropdownPosition, setDropdownPosition] = React.useState<
    "bottom" | "top"
  >("bottom");
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value: string) => {
    onSelectionChange(selectedValues.filter((v) => v !== value));
  };

  // Calculate dropdown position when opening
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 300; // max-h-[300px] from the dropdown
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // If there's not enough space below but enough space above, show on top
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [open]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchValue("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) &&
      !selectedValues.includes(option.value)
  );

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  );

  return (
    <div className="relative w-full">
      {/* Custom Trigger */}
      <div
        ref={triggerRef}
        className={cn(
          "w-full justify-between border-[var(--border)] min-h-[40px] h-auto p-2 bg-white hover:bg-[var(--muted)]/20 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 transition-all duration-150 border rounded-md cursor-pointer flex items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-[var(--muted-foreground)] text-sm">
              {placeholder}
            </span>
          ) : (
            selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 text-xs px-2 py-1"
              >
                {option.label}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(option.value);
                  }}
                  className="h-4 w-4 p-0 ml-1 hover:bg-[var(--primary)]/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {/* Custom Dropdown with Smart Positioning and Animations */}
      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute left-0 right-0 bg-white border border-[var(--border)] rounded-lg z-[999999] max-h-[300px] overflow-hidden",
            "animate-in fade-in-0 zoom-in-95",
            dropdownPosition === "top"
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2"
          )}
          style={{ zIndex: 999999 }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-[var(--border)]">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/10">
                {emptyMessage}
              </div>
            ) : (
              <div className="py-0.5">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--muted)]/30 cursor-pointer transition-all duration-150 bg-white rounded-sm"
                  >
                    <Check className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
