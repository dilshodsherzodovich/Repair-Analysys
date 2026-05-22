"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, Loader2 } from "lucide-react";

import { PageHeader } from "@/ui/page-header";
import { Input } from "@/ui/input";
import { EmptyState } from "@/ui/empty-state";
import { canAccessSection } from "@/lib/permissions";
import { authService } from "@/api/services/auth.service";
import { useGetLocomotives } from "@/api/hooks/use-locomotives";
import { SortedLocomotiveData } from "@/api/types/locomotive";

import UnauthorizedPage from "../unauthorized/page";

export default function Tu152JournalPage() {
  const t = useTranslations("Tu152JournalPage");

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
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="pb-6 md:pb-8">
        <div className="mb-3 md:mb-4 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("locomotive_search_placeholder")}
              className="pl-8 mb-0 h-9"
            />
          </div>
        </div>

        {isPending && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">{t("loading")}</span>
          </div>
        )}

        {!isPending && filtered.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
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
    </>
  );
}

function LocomotiveCard({ loco }: { loco: SortedLocomotiveData }) {
  return (
    <Link
      href={`/tu152-journal/${loco.id}`}
      className="block rounded-md border border-slate-200 bg-white px-2.5 py-2 hover:border-slate-400 hover:bg-slate-50 transition-colors"
    >
      <div className="text-sm font-semibold text-slate-800 truncate">
        {loco.name}
        {loco.model_name && (
          <span className="ml-1 font-normal text-slate-500">
            · {loco.model_name}
          </span>
        )}
      </div>
    </Link>
  );
}
