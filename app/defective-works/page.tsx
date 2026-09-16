"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/ui/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import { canAccessSection, isEchAccount } from "@/lib/permissions";
import UnauthorizedPage from "../unauthorized/page";
import { NosozliklarTab } from "@/components/defective-works/nosozliklar-tab";
import { TU152Tab } from "@/components/defective-works/tu152-tab";

export default function DefectiveWorksPage() {
  const t = useTranslations("DefectiveWorksPage");
  const { getAllQueryValues, updateQuery } = useFilterParams();
  const { mainTab } = getAllQueryValues();

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "defective-works")) {
    return <UnauthorizedPage />;
  }

  const isEchUser = isEchAccount(currentUser);

  const [currentMainTab, setCurrentMainTab] = useState<string>(
    isEchUser ? "nosozliklar" : mainTab || "nosozliklar",
  );

  const handleMainTabChange = useCallback(
    (value: string) => {
      if (isEchUser && value !== "nosozliklar") return;
      setCurrentMainTab(value);
      updateQuery({ mainTab: value, page: "1" });
    },
    [isEchUser, updateQuery],
  );

  const breadcrumbs = [
    { label: t("breadcrumbs.home"), href: "/" },
    { label: t("breadcrumbs.current"), current: true },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={breadcrumbs}
      />

      <div className="px-6">
        <Tabs value={currentMainTab} onValueChange={handleMainTabChange}>
          <TabsList className="bg-[#F1F5F9] p-1 gap-0 border-0 rounded-lg inline-flex">
            <TabsTrigger value="nosozliklar">
              {t("tab_nosozliklar")}
            </TabsTrigger>
            {!isEchUser && (
              <TabsTrigger value="tu152">{t("tab_tu152")}</TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {currentMainTab === "nosozliklar" && <NosozliklarTab />}
      {!isEchUser && currentMainTab === "tu152" && <TU152Tab />}
    </div>
  );
}
