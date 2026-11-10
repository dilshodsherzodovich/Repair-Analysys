"use client";

import { useTranslations } from "next-intl";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import type { Organization } from "@/api/types/organizations";
import { SearchableSelect } from "@/ui/select";
import { FilterField } from "@/ui/filter-bar";

/**
 * Organization used when the URL carries no selection. Every report is always
 * scoped to one concrete organization — there is no "all organizations" mode,
 * so this id is what the first request on a fresh page load sends.
 */
export const DEFAULT_ORGANIZATION_ID = 1;

/**
 * The organization filter, shared by every report page.
 *
 * In dejurniy this lived in a global header that this project does not have,
 * so each report renders the select itself and reads the value from here.
 */
export function useReportOrganization() {
  const { filters, setFilters } = useReportFilters();

  // Legacy "all" from the earlier port, and any non-numeric junk in the URL,
  // both fall back to the default rather than sending nothing.
  const parsed = Number(filters.organization);
  const organizationId =
    Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ORGANIZATION_ID;

  return {
    value: String(organizationId),
    organizationId,
    setOrganization: (next: string) => setFilters({ organization: next }),
  };
}

/**
 * The organization filter of every report: a labelled FilterField with the
 * kit select. No styling options; it looks the same on every report.
 */
export function ReportOrganizationSelect({ disabled }: { disabled?: boolean }) {
  const tc = useTranslations("Common");
  const { value, setOrganization } = useReportOrganization();

  const { data, isLoading } = useOrganizations({ no_page: true });
  const organizations: Organization[] = Array.isArray(data)
    ? data
    : ((data as { results?: Organization[] } | undefined)?.results ?? []);

  return (
    <FilterField label={tc("organization")} width="lg">
      <SearchableSelect
        size="md"
        searchable
        loading={isLoading}
        disabled={disabled}
        value={value}
        onValueChange={setOrganization}
        placeholder={tc("organization")}
        options={organizations.map((org) => ({ value: String(org.id), label: org.name }))}
      />
    </FilterField>
  );
}
