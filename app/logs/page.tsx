"use client";

import { useEffect } from "react";
import { useSearchParams, redirect } from "next/navigation";
import { useLogs } from "@/api/hooks/use-logs";
import LogsTable from "@/components/logs/logs-table";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { canAccessSection } from "@/lib/permissions";
import { Card } from "@/ui/card";

export default function LogsPage() {
  const { updateQuery } = useFilterParams();
  const searchParams = useSearchParams();
  const { page, action, content_type, user, q } = Object.fromEntries(
    searchParams.entries()
  );

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "logs")) {
    redirect("/");
  }

  useEffect(() => {
    if (!page) updateQuery({ page: "1" });
  }, [page, updateQuery]);

  const { data, isLoading } = useLogs({
    page: parseInt((page as string) || "1", 10),
    action,
    content_type,
    user,
    search: q,
  });

  const handlePageChange = (newPage: number) => {
    updateQuery({ page: String(newPage) });
  };

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center space-x-2 text-sm text-[#6b7280] mb-2">
          <span>Asosiy</span>
          <span>›</span>
          <span className="text-[#1f2937]">Loglar</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#1f2937]">Loglar</h1>
      </div>
      <LogsTable
        logs={data}
        isLoading={isLoading}
        page={parseInt((page as string) || "1", 10)}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
