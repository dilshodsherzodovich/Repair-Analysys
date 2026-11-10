"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/ui/page-header";
import { EmptyState } from "@/ui/empty-state";
import { canAccessSection } from "@/lib/permissions";
import { authService } from "@/api/services/auth.service";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { SortedLocomotiveData } from "@/api/types/locomotive";

import UnauthorizedPage from "../unauthorized/page";
import { Page } from "@/ui/page";
import { FilterBar, FilterField, FilterReset, SearchInput } from "@/ui/filter-bar";

export default function Tu152JournalPage() {
  const t = useTranslations("Tu152JournalPage");
  const tc = useTranslations("Common");

  const currentUser = authService.getUser();
  if (!currentUser || !canAccessSection(currentUser, "tu152-journal")) {
    return <UnauthorizedPage />;
  }

  const organizationId = currentUser.branch?.organization?.id;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: locomotivesData, isPending } = useGetLocomotives(
    true,
    undefined,
    { no_page: true, organization: organizationId },
  );

  const allLocomotives: SortedLocomotiveData[] = useMemo(
    () => locomotivesData?.results ?? [],
    [locomotivesData],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allLocomotives;
    return allLocomotives.filter((loc) => {
      const name = (loc.name ?? "").toLowerCase();
      const model = (loc.model_name ?? "").toLowerCase();
      return name.includes(q) || model.includes(q);
    });
  }, [allLocomotives, searchTerm]);

  return (
    <Page>
      <PageHeader
        title={t("title")}
        description={t("description")}
        filters={
          <FilterBar>
            <FilterField label={tc("search")} width="lg">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t("locomotive_search_placeholder")}
              />
            </FilterField>
            <FilterReset active={Boolean(searchTerm)} onReset={() => setSearchTerm("")} />
          </FilterBar>
        }
      />

      <div>

        {isPending && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">{t("loading")}</span>
          </div>
        )}

        {!isPending && filtered.length === 0 && (
          <div className="rounded-lg border border-border bg-background p-6">
            <EmptyState
              title={t("no_locomotives_title")}
              description={
                searchTerm
                  ? t("no_locomotives_search")
                  : t("no_locomotives_desc")
              }
            />
          </div>
        )}

        {!isPending && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {filtered.map((loc) => (
              <LocomotiveCard key={loc.id} loco={loc} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

function LocomotiveCard({ loco }: { loco: SortedLocomotiveData }) {
  return (
    <Link
      href={`/tu152-journal/${loco.id}`}
      className="block rounded-md border border-border bg-background px-2.5 py-2 hover:border-foreground-subtle hover:bg-surface-muted transition-colors"
    >
      <div className="text-sm font-semibold text-foreground truncate">
        {loco.name}
        {loco.model_name && (
          <span className="ml-1 font-normal text-muted-foreground">
            · {loco.model_name}
          </span>
        )}
      </div>
    </Link>
  );
}
