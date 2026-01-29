"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LocomotivePassportForm from "./components/locomotive-passport-form";
import { PageHeader } from "@/ui/page-header";
import { PermissionGuard } from "@/components/permission-guard";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";

export default function LocomotivePassportPage() {
  const t = useTranslations("LocomotivePassportPage");
  const params = useParams();
  const depotId = params.id as string;
  const locomotiveId = params.locomotiveId as string;

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  if (!currentUser || !canAccessSection(currentUser, "depo")) {
    return <UnauthorizedPage />;
  }

  return (
    <PermissionGuard
      permission="view_locomotive_passport"
      showError={true}
      fallback={
        <div className="mt-6">
          <PageHeader
            title={t("title")}
            description={t("description")}
          />
        </div>
      }
    >
      <div>
        <LocomotivePassportForm depotId={depotId} locomotiveId={locomotiveId} />
      </div>
    </PermissionGuard>
  );
}
