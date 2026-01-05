import { UserRole } from "@/api/types/user";
import { UserData } from "@/api/types/auth";

export type Permission =
  | "view_dashboard"
  | "view_reports"
  | "view_defects"
  | "view_defective_works"
  | "view_stations"
  | "view_orders"
  | "create_order"
  | "edit_order"
  | "delete_order"
  | "create_defective_work"
  | "edit_defective_work"
  | "delete_defective_work"
  | "view_autoconnecters"
  | "view_pantograf"
  | "create_pantograf"
  | "edit_pantograf"
  | "delete_pantograf"
  | "choose_organization";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "view_reports",
    "view_defects",
    "view_defective_works",
    "view_stations",
    "view_orders",
    "create_order",
    "edit_order",
    "delete_order",
    "create_defective_work",
    "edit_defective_work",
    "delete_defective_work",
    "view_autoconnecters",
    "view_pantograf",
    "create_pantograf",
    "edit_pantograf",
    "delete_pantograf",
    "choose_organization",
  ],
  moderator: [
    "view_dashboard",
    "view_reports",
    "view_defects",
    "view_defective_works",
    "view_stations",
    "view_orders",
    "create_order",
    "edit_order",
    "delete_order",
    "create_defective_work",
    "edit_defective_work",
    "delete_defective_work",
    "view_autoconnecters",
    "view_pantograf",
    "create_pantograf",
    "edit_pantograf",
    "delete_pantograf",
    "choose_organization",
  ],
  repair_engineer: [
    "view_dashboard",
    "view_reports",
    "view_defects",
    "view_defective_works",
    "view_stations",
    "view_orders",
    "create_order",
    "edit_order",
    "delete_order",
    "create_defective_work",
    "edit_defective_work",
    "delete_defective_work",
    "view_autoconnecters",
    "view_pantograf",
    "create_pantograf",
    "edit_pantograf",
    "delete_pantograf",
  ],
};

export function hasPermission(
  user: UserData | null,
  permission: Permission
): boolean {
  if (!user) return false;
  const role = user?.role as UserRole;
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  return userPermissions.includes(permission);
}

export function hasAnyPermission(
  user: UserData | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasAllPermissions(
  user: UserData | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.every((permission) => hasPermission(user, permission));
}

export function canAccessSection(
  user: UserData | null,
  section: string
): boolean {
  switch (section) {
    case "dashboard":
      return hasPermission(user, "view_dashboard");
    case "reports": {
      return hasPermission(user, "view_reports");
    }
    case "defects": {
      return hasPermission(user, "view_defects");
    }
    case "defective-works": {
      return hasPermission(user, "view_defective_works");
    }
    case "stations": {
      return hasPermission(user, "view_stations");
    }
    case "orders": {
      return hasPermission(user, "view_orders");
    }
    case "autoconnecters": {
      return hasPermission(user, "view_autoconnecters");
    }
    case "pantograf": {
      return hasPermission(user, "view_pantograf");
    }
    default:
      return false;
  }
}
