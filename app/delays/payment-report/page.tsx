"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/ui/page-header";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";
import {
  SrivPaymentFilters,
  SrivPaymentReport,
} from "@/components/delays/sriv-payment-report";
import { authService } from "@/api/services/auth.service";

export default function SrivPaymentReportPage() {
  const t = useTranslations("SrivPaymentReportPage");

  const currentUser =
    authService.getUser();
  if (!currentUser || !canAccessSection(currentUser, "sriv-payment-report")) {
    return <UnauthorizedPage />;
  }

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
        filters={<SrivPaymentFilters />}
      />
      <SrivPaymentReport />
    </div>
  );
}
