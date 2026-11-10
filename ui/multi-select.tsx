"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { X, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
  size?: "sm" | "md" | "lg";
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  disabled = false,
  size = "md",
}: MultiSelectProps) {
  const t = useTranslations("Common");
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

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // The field stays one line: the first choice and "+N" for the rest
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  );
  const [first, ...rest] = selectedOptions;

  return (
    <div className="relative w-full">
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-background px-3 text-foreground transition-colors hover:border-foreground-subtle",
          size === "sm" && "h-8 text-xs",
          size === "md" && "h-9 text-sm",
          size === "lg" && "h-11 text-base",
          disabled && "pointer-events-none cursor-not-allowed bg-surface-muted opacity-50",
          className
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          {first ? (
            <>
              <span className="truncate" title={selectedOptions.map((o) => o.label).join(", ")}>
                {first.label}
              </span>
              {rest.length > 0 && (
                <Badge variant="primary" size="sm" className="shrink-0">
                  +{rest.length}
                </Badge>
              )}
            </>
          ) : (
            <span className="truncate text-foreground-subtle">{placeholder ?? t("select")}</span>
          )}
        </span>
        {selectedOptions.length > 0 && !disabled && (
          <button
            type="button"
            aria-label={t("reset")}
            onClick={(e) => {
              e.stopPropagation();
              onSelectionChange([]);
            }}
            className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            // At least as wide as the field, wider for long options
            "absolute left-0 z-50 w-max min-w-full max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-border-strong bg-background text-foreground shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            dropdownPosition === "top"
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2"
          )}
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder={searchPlaceholder ?? t("search_placeholder")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-8 w-full rounded-md border border-border-strong bg-background pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-sm text-muted-foreground">
                {emptyMessage ?? t("no_data")}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                      selected && "font-medium text-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-strong"
                      )}
                    >
                      {selected && <Check className="size-3" />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
