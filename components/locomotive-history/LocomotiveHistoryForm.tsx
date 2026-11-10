"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { DateRangeField, type DateRange } from "@/ui/date-range-field";
import { FilterBar, FilterField, FilterReset } from "@/ui/filter-bar";
import { SearchableSelect } from "@/ui/select";

/** Characters required before a lookup is sent. */
const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

interface LocomotiveHistoryFormProps {
  /** Called as soon as a locomotive and a full period are chosen. */
  onSubmit: (locomotive: number, startDate: Date, endDate: Date) => void;
  /** Called by "Tozalash", so the page can drop the shown history. */
  onClear: () => void;
}

/**
 * The locomotive history filters (standard FilterBar): a locomotive looked up
 * on the server by name, and the period. The history loads as soon as both
 * are set; there is no separate submit button.
 */
export function LocomotiveHistoryForm({ onSubmit, onClear }: LocomotiveHistoryFormProps) {
  const t = useTranslations("Logs");
  const tc = useTranslations("Common");

  // The picked locomotive is held whole rather than by id: results come from a
  // search, so the current list will not contain it once the query changes.
  const [selected, setSelected] = useState<{ id: number; label: string } | null>(null);
  const [range, setRange] = useState<DateRange>({});

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const term = debouncedSearch.trim();
  // Locomotives are looked up by name via the API's `search` param: the list
  // is far too large to fetch whole.
  const { data, isFetching } = useGetLocomotives(term.length >= MIN_SEARCH_LENGTH, undefined, {
    no_page: true,
    search: term,
  });
  const options = (data?.results ?? []).map((loco) => ({
    value: String(loco.id),
    label: `${loco.name} (${loco.model_name})`,
  }));

  const apply = (nextLoco: typeof selected, nextRange: DateRange) => {
    if (nextLoco && nextRange.from && nextRange.to) {
      onSubmit(nextLoco.id, nextRange.from, nextRange.to);
    }
  };

  return (
    <FilterBar>
      <FilterField label={t("locomotive")} width="lg">
        <SearchableSelect
          size="md"
          searchable
          onSearch={setSearch}
          loading={isFetching}
          value={selected ? String(selected.id) : ""}
          selectedLabel={selected?.label}
          onValueChange={(id) => {
            const option = options.find((o) => o.value === id);
            const next = option ? { id: Number(id), label: option.label } : null;
            setSelected(next);
            apply(next, range);
          }}
          options={options}
          placeholder={tc("select")}
          searchPlaceholder={tc("search_placeholder")}
        />
      </FilterField>
      <FilterField label={tc("period")} width="lg">
        <DateRangeField
          value={range}
          onChange={(next) => {
            setRange(next);
            apply(selected, next);
          }}
        />
      </FilterField>
      <FilterReset
        active={Boolean(selected || range.from)}
        onReset={() => {
          setSelected(null);
          setSearch("");
          setRange({});
          onClear();
        }}
      />
    </FilterBar>
  );
}
