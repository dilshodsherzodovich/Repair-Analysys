"use client";

import { useTranslations } from "next-intl";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { useReportFilters } from "@/lib/hooks/useReportFilters";
import type { Organization } from "@/api/types/organizations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { cn } from "@/lib/utils";

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

/** Label styling shared by the report filter rows that caption their fields. */
export const REPORT_FILTER_LABEL =
  "text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1";

export function ReportOrganizationSelect({
  className,
  triggerClassName,
  label,
  labelClassName,
  disabled,
}: {
  className?: string;
  triggerClassName?: string;
  /**
   * Omit on rows whose other controls are uncaptioned. `true` uses the
   * component's own translated caption.
   */
  label?: string | boolean;
  labelClassName?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Reports");
  const { value, setOrganization } = useReportOrganization();

  const { data } = useOrganizations({ no_page: true });
  const organizations: Organization[] = Array.isArray(data)
    ? data
    : ((data as { results?: Organization[] } | undefined)?.results ?? []);

  // h-9 matches every other control in the report filter rows, so the select
  // sits on the same line at the same height.
  const select = (
    <Select value={value} onValueChange={setOrganization} disabled={disabled}>
      {/* SelectTrigger ships with `mb-3 sm:mb-4`, which lifts it off the row's
          baseline. twMerge scopes responsive variants separately, so both the
          base and the `sm:` margin have to be cleared. */}
      <SelectTrigger
        className={cn("h-9 w-[220px] text-sm mb-0 sm:mb-0", triggerClassName)}
      >
        <SelectValue placeholder={t("organization")} />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={String(org.id)}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (!label) return <div className={className}>{select}</div>;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className={cn(REPORT_FILTER_LABEL, labelClassName)}>
        {label === true ? t("organization") : label}
      </span>
      {select}
    </div>
  );
}
