"use client";

import type React from "react";

import {
  hasPermission,
  hasAnyPermission,
  type Permission,
} from "@/lib/permissions";
import { ShieldX } from "lucide-react";
import { Alert, AlertDescription } from "@/ui/alert";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showError = false,
}: PermissionGuardProps) {
  const user = JSON.parse(localStorage.getItem("user")!);

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll
      ? permissions.every((p) => hasPermission(user, p))
      : hasAnyPermission(user, permissions);
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldX className="w-4 h-4" />
          <AlertDescription>
            You don't have permission to access this feature.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
