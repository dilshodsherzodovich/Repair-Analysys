"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/popover";
import { Label } from "@/ui/label";
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/ui/command";
import { Loader2 } from "lucide-react";

/** Characters required before a lookup is sent. */
const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

interface LocomotiveHistoryFormProps {
  onSubmit: (
    locomotive: number | undefined,
    startDate: Date | undefined,
    endDate: Date | undefined
  ) => void;
  isLoading?: boolean;
}

export function LocomotiveHistoryForm({
  onSubmit,
  isLoading,
}: LocomotiveHistoryFormProps) {
  const t = useTranslations("LocomotiveHistory");
  const globalT = useTranslations("Logs");

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [locomotiveOpen, setLocomotiveOpen] = useState(false);

  // The picked locomotive is held whole rather than by id: results come from a
  // search, so the current list will not contain it once the query changes.
  const [selected, setSelected] = useState<{ id: number; label: string } | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const term = debouncedSearch.trim();
  const canSearch = term.length >= MIN_SEARCH_LENGTH;

  // Locomotives are looked up by name via the API's `search` param — the list
  // is far too large to fetch whole.
  const { data: trainsData, isFetching: isSearching } = useGetLocomotives(
    canSearch,
    undefined,
    { no_page: true, search: term }
  );

  const results = trainsData?.results ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected || !startDate || !endDate) return;
    onSubmit(selected.id, startDate, endDate);
  };

  const handleReset = () => {
    setSelected(null);
    setSearch("");
    setDebouncedSearch("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const isFormValid = selected && startDate && endDate;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Locomotive — type to search by name */}
        <div className="space-y-2">
          <Label>{globalT("locomotive")} *</Label>
          <Popover open={locomotiveOpen} onOpenChange={setLocomotiveOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className="h-9 w-full justify-between font-normal"
              >
                <span className={cn(!selected && "text-muted-foreground")}>
                  {selected ? selected.label : t("selectLocomotive")}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              {/* Results come from the server, so Command must not filter them
                  again against its own input. */}
              <Command shouldFilter={false}>
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder={globalT("searchLocomotive")}
                />

                {!canSearch ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {t("typeToSearch", { count: MIN_SEARCH_LENGTH })}
                  </div>
                ) : isSearching ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loading")}
                  </div>
                ) : results.length === 0 ? (
                  <CommandEmpty>{t("noResults")}</CommandEmpty>
                ) : (
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {results.map((train) => {
                      // `/sorted/locomotives/` returns `model_name`, not a
                      // nested `locomotive_model` object.
                      const label = [train.model_name, train.name]
                        .filter(Boolean)
                        .join(" - ");
                      return (
                        <CommandItem
                          key={train.id}
                          value={String(train.id)}
                          onSelect={() => {
                            setSelected({ id: train.id, label });
                            setLocomotiveOpen(false);
                          }}
                        >
                          {label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>{globalT("startDate")} *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-9 w-full pl-3 text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? (
                  format(startDate, "PPP", { locale: uz })
                ) : (
                  <span>{t("selectStartDate")}</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>{globalT("endDate")} *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-9 w-full pl-3 text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                {endDate ? (
                  format(endDate, "PPP", { locale: uz })
                ) : (
                  <span>{t("selectEndDate")}</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                disabled={(date) => (startDate ? date < startDate : false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
        >
          {globalT("clear")}
        </Button>
        <Button type="submit" disabled={!isFormValid || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loading")}
            </>
          ) : (
            t("generateReport")
          )}
        </Button>
      </div>
    </form>
  );
}
