"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComponentGroupsInfinite } from "@/api/hooks/use-component-registry";

interface ComponentGroupSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Name for a group id restored from the URL, before the list is fetched. */
  selectedLabelFallback?: string;
  placeholder?: string;
  className?: string;
}

/** How close to the bottom (px) triggers loading the next page. */
const SCROLL_THRESHOLD = 80;

export function ComponentGroupSelect({
  value,
  onValueChange,
  selectedLabelFallback,
  placeholder,
  className,
}: ComponentGroupSelectProps) {
  const t = useTranslations("Filters");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom",
  );
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search runs on the API, so only hit it once typing settles.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useComponentGroupsInfinite(debouncedSearch, open);

  const groups = useMemo(
    () => data?.pages.flatMap((page) => page.results ?? []) ?? [],
    [data],
  );

  const selectedLabel =
    groups.find((group) => String(group.id) === value)?.name ??
    pickedLabel ??
    selectedLabelFallback ??
    null;

  // Flip the panel up when there is no room below.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setDropdownPosition(
      spaceBelow < 320 && rect.top > 320 ? "top" : "bottom",
    );
  }, [open]);

  // Close on outside click, resetting the search for the next open.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
      fetchNextPage();
    }
  };

  const handleSelect = (id: number, name: string) => {
    setPickedLabel(name);
    onValueChange(String(id));
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between border border-[#CAD5E2] rounded-md bg-white hover:border-[#94a3b8] focus-within:ring-2 focus-within:ring-[#2354bf]/20 focus-within:border-[#2354bf] cursor-pointer min-h-10 h-10 px-3 text-sm text-left transition-colors"
      >
        <span
          className={cn(
            "truncate flex-1 min-w-0",
            selectedLabel ? "text-[#0F172B]" : "text-[#90A1B9]",
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#64748B]" />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute left-0 right-0 bg-white border border-[#CAD5E2] rounded-lg overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-100",
            dropdownPosition === "top"
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2",
          )}
          style={{ zIndex: 999999 }}
        >
          <div className="p-2 border-b border-[#E2E8F0]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                autoFocus
                placeholder={t("search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full pl-8 pr-8 py-2 text-sm border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2354bf]/20 focus:border-[#2354bf]"
              />
              {search !== debouncedSearch && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#64748B]" />
              )}
            </div>
          </div>

          <div
            className="max-h-[280px] overflow-y-auto py-0.5"
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div className="p-4 text-center text-sm text-[#64748B]">
                {t("loading")}
              </div>
            ) : groups.length === 0 ? (
              <div className="py-3 text-center text-sm text-[#64748B]">
                {t("no_results")}
              </div>
            ) : (
              <>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleSelect(group.id, group.name)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F1F5F9] cursor-pointer transition-colors",
                      String(group.id) === value &&
                        "bg-[#EFF6FF] text-[#1d4ed8] font-medium",
                    )}
                  >
                    {String(group.id) === value && (
                      <Check className="h-4 w-4 shrink-0 text-[#2354bf]" />
                    )}
                    <span className="truncate">{group.name}</span>
                  </button>
                ))}
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-[#64748B]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loading")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
