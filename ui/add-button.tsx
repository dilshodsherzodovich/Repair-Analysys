"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/ui/button";
import { PermissionGuard } from "@/components/permission-guard";
import type { Permission } from "@/lib/permissions";

/**
 * The page's "Qo'shish" action: same size, icon and label on every page.
 * Renders nothing without a handler; wraps itself in a PermissionGuard when
 * given a permission. The page title says what is being added.
 */
export function AddButton({
  onClick,
  permission,
}: {
  onClick?: () => void;
  permission?: Permission;
}) {
  const t = useTranslations("Common");
  if (!onClick) return null;

  const button = (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("add")}
    </Button>
  );
  return permission ? <PermissionGuard permission={permission}>{button}</PermissionGuard> : button;
}
