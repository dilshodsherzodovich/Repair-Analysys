"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * URL-backed filter state for the report pages, ported from the dejurniy
 * project that owns the same endpoints.
 *
 * Deliberately separate from `useFilterParams`: that hook exposes
 * `updateQuery` / `getQueryValue`, whereas the reports are written against a
 * `{ filters, setFilters }` object. Keeping both means the ported pages read
 * exactly as they do in the source project.
 */
export type ReportFilters = Record<string, string>;

export const useReportFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo<ReportFilters>(() => {
    const params: ReportFilters = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  const setFilters = useCallback(
    (newFilters: Partial<ReportFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      let hasChanges = false;

      Object.entries(newFilters).forEach(([key, value]) => {
        const currentValue = params.get(key);
        if (value && value !== currentValue) {
          params.set(key, value);
          // Any filter change resets paging.
          if (key !== "page") params.set("page", "1");
          hasChanges = true;
        } else if (!value && currentValue) {
          params.delete(key);
          if (key !== "page") params.set("page", "1");
          hasChanges = true;
        }
      });

      if (hasChanges) router.replace(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  return { filters, setFilters };
};
