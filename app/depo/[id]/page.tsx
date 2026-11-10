"use client";

import { useTranslations } from "next-intl";
import { useGetLocomotiveModels } from "@/api/hooks/use-locomotives";
import LocomotivesTable from "./components/locomotives-table";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import { authService } from "@/api/services/auth.service";
import { Page } from "@/ui/page";

export default function DepoLocomotives() {
  const t = useTranslations("DepoPage");
  const currentUser =
    authService.getUser();
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
    <Page>
      <PageHeader
        title={t("title")}
        description={t("description")}
        filters={
          <PageFilters
            filters={pageFilters}
            hasSearch={true}
            searchPlaceholder={t("search_placeholder")}
          />
        }
      />

      <>
      </>

      <LocomotivesTable />
    </Page>
  );
}
