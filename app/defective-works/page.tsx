"use client";

import { useCallback, useState } from "react";
import { PageHeader } from "@/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { NosozliklarTab } from "@/components/defective-works/nosozliklar-tab";
import { TU152Tab } from "@/components/defective-works/tu152-tab";

export default function DefectiveWorksPage() {
  const { getAllQueryValues, updateQuery } = useFilterParams();
  const { mainTab } = getAllQueryValues();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  if (!currentUser || !canAccessSection(currentUser, "defective-works")) {
    return <UnauthorizedPage />;
  }

  const [currentMainTab, setCurrentMainTab] = useState<string>(
    mainTab || "nosozliklar"
  );

  const handleMainTabChange = useCallback(
    (value: string) => {
      setCurrentMainTab(value);
      updateQuery({ mainTab: value, page: "1" });
    },
    [updateQuery]
  );

  const breadcrumbs = [
    { label: "Asosiy", href: "/" },
    { label: "Nosoz ishlar jurnali", current: true },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Nosoz ishlar jurnali"
        description="Tekshirishlar va nosozliklarni kuzatish"
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6">
        <Tabs value={currentMainTab} onValueChange={handleMainTabChange}>
          <TabsList className="bg-[#F1F5F9] p-1 gap-0 border-0 rounded-lg inline-flex">
            <TabsTrigger value="nosozliklar">Nosozliklar</TabsTrigger>
            <TabsTrigger value="tu152">TU152 Nosozliklar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {currentMainTab === "nosozliklar" && <NosozliklarTab />}
      {currentMainTab === "tu152" && <TU152Tab />}
    </div>
  );
}


