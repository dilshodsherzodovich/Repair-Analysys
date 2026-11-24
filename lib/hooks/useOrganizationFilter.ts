import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrganizations } from "@/api/hooks/use-organizations";
import type { Organization } from "@/api/types/organizations";
import type { FiltersQuery } from "@/ui/filters";
import { useFilterParams } from "@/lib/hooks/useFilterParams";

const ALL = "all";

/**
 * Organization select for pages under /{section}/{orgId}: shows the route's
 * organization (the one picked in the sidebar) by default. Picking another
 * switches the route, keeping the other filters (the sidebar follows the
 * route); "all" stays on the route and adds `?organization=all`.
 */
export function useOrganizationFilter(
  section: string,
  organizationId: number,
  { label, allLabel }: { label: string; allLabel: string },
): { filter: FiltersQuery; allOrganizations: boolean } {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateQuery } = useFilterParams();
  const { data, isLoading } = useOrganizations({ no_page: true });
  const allOrganizations = searchParams.get("organization") === ALL;

  const filter = useMemo((): FiltersQuery => {
    const organizations: Organization[] = Array.isArray(data)
      ? data
      : ((data as { results?: Organization[] } | undefined)?.results ?? []);

    return {
      name: "organization",
      label,
      isSelect: true,
      options: [
        { label: allLabel, value: ALL },
        ...organizations.map((org) => ({
          label: org.name,
          value: String(org.id),
        })),
      ],
      searchable: true,
      loading: isLoading,
      permission: "choose_organization",
      value: allOrganizations ? ALL : String(organizationId),
      onValueChange: (value: string) => {
        if (value === ALL) {
          updateQuery({ organization: ALL });
          return;
        }
        const orgId = Number(value);
        if (!orgId) return;
        const params = new URLSearchParams(searchParams.toString());
        params.delete("organization");
        const query = params.toString();
        router.push(`/${section}/${orgId}${query ? `?${query}` : ""}`);
      },
    };
    // updateQuery is rebuilt every render; it only reads the current URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading, label, allLabel, allOrganizations, organizationId, router, searchParams, section]);

  return { filter, allOrganizations };
}
