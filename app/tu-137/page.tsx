"use client";

import { canAccessSection } from "@/lib/permissions";
import React from "react";
import UnauthorizedPage from "../unauthorized/page";
import { PageHeader } from "@/ui/page-header";
import { PaginatedTable, TableColumn } from "@/ui/paginated-table";
import { useTu137Records } from "@/api/hooks/use-tu137";
import { Tu137Record } from "@/api/types/tu137";

export default function Tu137Page() {
  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const pDepoId = currentUser?.emm_depo_id;

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useTu137Records({
    p_depo_id: pDepoId,
  });

  if (!currentUser || !canAccessSection(currentUser, "tu-137")) {
    return <UnauthorizedPage />;
  }

  const columns: TableColumn<Tu137Record>[] = [
    { key: "id", header: "ID" },
    { key: "depo_name", header: "Depo" },
    { key: "organization_name", header: "Organization" },
    { key: "group_name", header: "Group" },
    { key: "station_name", header: "Station 1" },
    { key: "station2_name", header: "Station 2" },
    { key: "lokomotiv_name", header: "Locomotive" },
    { key: "mashinist_fio", header: "Mashinist" },
    { key: "status_name", header: "Status" },
    {
      key: "create_date",
      header: "Created Date",
      accessor: (row) => new Date(row.create_date).toLocaleString(),
    },
    {
      key: "comments",
      header: "Comments",
      accessor: (row) => (
        <div className="whitespace-pre-wrap min-w-[200px] text-sm">
          {row.comments}
        </div>
      ),
    },
  ];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "TU-137 Records", current: true },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="TU-137"
        description="List of TU-137 records"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6 py-6 border-t border-slate-200 mt-4">
        <PaginatedTable
          columns={columns}
          data={apiResponse?.data ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error as Error}
          totalPages={1}
          totalItems={apiResponse?.data?.length ?? 0}
          updateQueryParams={false}
          showActions={false}
          emptyTitle="No records found"
          emptyDescription="No TU-137 records to display"
        />
      </div>
    </div>
  );
}
