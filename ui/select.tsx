"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default";
  }
>(({ className, children, size = "default", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-base",
      "transition-colors outline-none",
      "focus:border-blue-500 focus:ring-0 hover:border-gray-400",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
      "aria-invalid:border-red-500 aria-invalid:focus:border-red-500",
      "mb-4", // Added margin bottom for spacing between form elements
      "md:text-sm",
      "[&>span]:line-clamp-1",
      "data-[placeholder]:text-muted-foreground",
      "[&>span]:text-[#0F172B] [&>span]:data-[placeholder]:text-muted-foreground",
      size === "sm" && "h-8 text-xs",
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
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-300 bg-white text-[#0F172B] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
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
      "py-1.5 pl-8 pr-2 text-sm font-semibold text-[#0F172B]",
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
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none focus:bg-gray-100 focus:text-[#0F172B] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {/* <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-500" />
      </SelectPrimitive.ItemIndicator>
    </span> */}

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
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// --- SearchableSelect: optional search (searchable defaults to false), same design as multi-select ---

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  name?: string;
  size?: "sm" | "default";
  className?: string;
  triggerClassName?: string;
}

function SearchableSelect({
  value = "",
  onValueChange,
  options,
  placeholder = "Select...",
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  name,
  size = "default",
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [dropdownPosition, setDropdownPosition] = React.useState<"bottom" | "top">("bottom");
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue.trim()) return options;
    const q = searchValue.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchValue, searchable]);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 300;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropdownPosition(
        spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? "top" : "bottom"
      );
    }
  }, [open]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchValue("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearchValue("");
  };

  if (!searchable) {
    return (
      <div className={cn("relative w-full", className)}>
        {name && <input type="hidden" name={name} value={value} readOnly />}
        <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectPrimitive.Trigger
            className={cn(
              "flex h-10 w-full items-center justify-between cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-base",
              "transition-colors outline-none focus:border-blue-500 focus:ring-0 hover:border-gray-400",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              "md:text-sm [&>span]:line-clamp-1",
              "[&>span]:text-[#0F172B] [&>span]:data-[placeholder]:text-muted-foreground",
              "mb-4",
              size === "sm" && "h-8 text-xs",
              triggerClassName
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-300 bg-white text-[#0F172B] shadow-lg",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
              )}
              position="popper"
            >
              <SelectPrimitive.Viewport className="p-1">
                {options.length === 0 ? (
                  <div className="py-3 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                ) : (
                  options.map((opt) => (
                    <SelectPrimitive.Item
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none focus:bg-gray-100 focus:text-[#0F172B] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))
                )}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-base",
          "transition-colors outline-none focus:border-blue-500 focus:ring-0 hover:border-gray-400",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          "md:text-sm [&>span]:line-clamp-1 mb-4",
          size === "sm" && "h-8 text-xs",
          triggerClassName
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            selectedOption ? "text-[#0F172B]" : "text-muted-foreground"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute left-0 right-0 z-[999999] max-h-[300px] overflow-hidden rounded-md border border-gray-300 bg-white text-[#0F172B] shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            dropdownPosition === "top"
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2"
          )}
          style={{ zIndex: 999999 }}
        >
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm text-[#0F172B] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100",
                    opt.value === value && "bg-blue-50 text-blue-700 font-medium",
                    opt.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  SearchableSelect,
};
