"use client";

import { useTranslations } from "next-intl";
import { useGetLocomotiveModels } from "@/api/hooks/use-locomotives";
import LocomotivesTable from "./components/locomotives-table";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";

export default function DepoLocomotives() {
  const t = useTranslations("DepoPage");
  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "depo")) {
    return <UnauthorizedPage />;
  }

  const { data: locomotiveModelsData, isPending: gettingLocomotiveModels } =
    useGetLocomotiveModels({ no_page: true });

  const pageFilters = [
    {
      name: "locModel",
      label: t("locModel_label"),
      isSelect: true,
      options: [
        { label: t("locModel_all"), value: "" },

        ...(locomotiveModelsData?.results?.map((model) => ({
          label: model?.name,
          value: String(model.id),
        })) || []),
      ],
      placeholder: t("locModel_placeholder"),
      searchable: true,
      clearable: true,
      loading: gettingLocomotiveModels,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="mt-4">
        <PageFilters
          filters={pageFilters}
          hasSearch={true}
          searchPlaceholder={t("search_placeholder")}
        />
      </div>

      <LocomotivesTable />
    </>
  );
}
