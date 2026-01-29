"use client";

import { useGetLocomotiveModels } from "@/api/hooks/use-locomotives";
import LocomotivesTable from "./components/locomotives-table";
import PageFilters from "@/ui/filters";
import { PageHeader } from "@/ui/page-header";

export default function DepoLocomotives() {
  const { data: locomotiveModelsData, isPending: gettingLocomotiveModels } =
    useGetLocomotiveModels({ no_page: true });

  const pageFilters = [
    {
      name: "locModel",
      label: "Lokomotiv rusumi",
      isSelect: true,
      options: [
        { label: "Barchasi", value: "" },

        ...(locomotiveModelsData?.results?.map((model) => ({
          label: model?.name,
          value: String(model.id),
        })) || []),
      ],
      placeholder: "Lokomotiv rusumini tanlang",
      searchable: true,
      clearable: true,
      loading: gettingLocomotiveModels,
    },
  ];

  return (
    <>
      <PageHeader
        title="Lokomotivlar"
        description="Depolardagi mavjud lokomotivlar"
      />

      <div className="mt-4">
        <PageFilters
          filters={pageFilters}
          hasSearch={true}
          searchPlaceholder="Qidiruv"
        />
      </div>

      <LocomotivesTable />
    </>
  );
}
