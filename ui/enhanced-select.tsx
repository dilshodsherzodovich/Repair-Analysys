"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    error?: boolean;
    success?: boolean;
  }
>(({ className, children, error, success, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
      "placeholder:text-[#9ca3af] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:line-clamp-1",
      error
        ? "border-[#ff5959] focus:ring-2 focus:ring-[#ff5959]/20"
        : success
        ? "border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
        : "border-[#d1d5db] focus:ring-2 focus:ring-[#2354bf]/20",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-white text-[#1f2937] shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 text-sm font-semibold text-[#374151]",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none",
      "focus:bg-[#f3f4f6] focus:text-[#1f2937] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[#2354bf]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[#e5e7eb]", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Enhanced Select with additional features
export interface EnhancedSelectProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const EnhancedSelect = React.forwardRef<HTMLDivElement, EnhancedSelectProps>(
  (
    {
      label,
      error,
      success,
      hint,
      placeholder = "Выберите опцию...",
      searchable,
      clearable,
      loading,
      options,
      value,
      onValueChange,
      className,
      ...props
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchTerm) return options;
      return options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm, searchable]);

    const selectedOption = options.find((option) => option.value === value);
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    const handleClear = () => {
      if (onValueChange) {
        onValueChange("");
      }
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <label className="text-sm font-medium text-[#374151] leading-none">
            {label}
          </label>
        )}
        <div className="relative">
          <Select
            value={value}
            onValueChange={onValueChange}
            onOpenChange={setIsOpen}
          >
            <SelectTrigger error={hasError} success={hasSuccess}>
              <div className="flex items-center justify-between w-full">
                <SelectValue placeholder={placeholder} />
                <div className="flex items-center space-x-1">
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-1 border-[#2354bf] border-t-transparent" />
                  )}
                  {hasError && (
                    <AlertCircle className="h-4 w-4 text-[#ff5959]" />
                  )}
                  {hasSuccess && (
                    <CheckCircle className="h-4 w-4 text-[#10b981]" />
                  )}
                  {clearable && value && !loading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="text-[#6b7280] hover:text-[#374151] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              {searchable && (
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                    <input
                      type="text"
                      placeholder="Поиск..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-[#2354bf]/20"
                    />
                  </div>
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#6b7280]">
                  Нет результатов
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        {hint && !error && !success && (
          <p className="text-xs text-[#6b7280]">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-[#ff5959] flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-[#10b981] flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);
EnhancedSelect.displayName = "EnhancedSelect";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  EnhancedSelect,
};
