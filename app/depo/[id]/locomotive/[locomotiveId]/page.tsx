"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LocomotivePassportForm from "./components/locomotive-passport-form";
import LocomotivePassportClassic from "./components/locomotive-passport-classic";
import { PageHeader } from "@/ui/page-header";
import { PermissionGuard } from "@/components/permission-guard";
import { canAccessSection } from "@/lib/permissions";
import UnauthorizedPage from "@/app/unauthorized/page";

export default function LocomotivePassportPage() {
  const t = useTranslations("LocomotivePassportPage");
  const params = useParams();
  const searchParams = useSearchParams();
  const depotId = params.id as string;
  const locomotiveId = params.locomotiveId as string;

  // Classic single-page passport is the default; `?design=new` opens the
  // dashboard rewrite. Keeping it in the URL makes the choice survive a
  // refresh and stay shareable as a link.
  const useNewDesign = searchParams.get("design") === "new";

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
        {useNewDesign ? (
          <LocomotivePassportForm depotId={depotId} locomotiveId={locomotiveId} />
        ) : (
          <LocomotivePassportClassic
            depotId={depotId}
            locomotiveId={locomotiveId}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
