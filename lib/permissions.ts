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
  | "view_delays"
  | "create_delay"
  | "edit_delay"
  | "delete_delay"
  | "upload_delay_report"
  | "view_delays_reports"
  | "choose_organization"
  | "filter_delay_station"

  // passport permissions
  | "view_depo"
  | "view_duty_uzel"
  | "create_duty_uzel_report"
  | "view_locomotive_passport"
  | "edit_locomotive_passport"
  | "view_locomotive_passport_inspections"
  | "create_locomotive_passport_inspection"
  | "edit_locomotive_passport_inspection"
  | "delete_locomotive_passport_inspection"
  | "view_locomotive_replacement_oil"
  | "create_locomotive_replacement_oil"
  | "edit_locomotive_replacement_oil"
  | "delete_locomotive_replacement_oil"

  // dpx permissions
  | "view_inspections"
  | "choose_inspection_organization"
  | "edit_inspection_location_section"

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "view_reports",
    "view_defects",
    "view_defective_works",
    "view_stations",
    "view_orders",
    "view_delays",
    "view_delays_reports",
    "create_defective_work",
    "edit_defective_work",
    "delete_defective_work",
    "view_autoconnecters",
    "view_pantograf",
    "create_pantograf",
    "edit_pantograf",
    "delete_pantograf",
    "choose_organization",
    "filter_delay_station",
    "view_depo",
    "view_duty_uzel",
    "create_duty_uzel_report",
    "view_pantograf",
    "create_pantograf",
    "edit_pantograf",
    "delete_pantograf",
    "view_locomotive_passport",
    "edit_locomotive_passport",
    "view_locomotive_passport_inspections",
    "view_locomotive_replacement_oil",
    "view_inspections",
    "choose_inspection_organization",
  ],
  moderator: [
    "view_dashboard",
    "view_reports",
    "view_defects",
    "view_defective_works",
    "view_stations",
    "view_orders",
    "view_delays",
    "view_delays_reports",
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
    "filter_delay_station",
    "view_depo", 
    "view_duty_uzel", 
    "view_pantograf", 
    "view_locomotive_passport", 
    "view_locomotive_passport_inspections", 
    "view_locomotive_replacement_oil",
    "view_inspections",
    "edit_inspection_location_section"
  ],
  passport_staff: ["view_depo", "view_locomotive_passport", "edit_locomotive_passport", "view_duty_uzel"],
  repair_staff: [
    "view_duty_uzel",
    "create_duty_uzel_report",
    
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
    "view_depo",
    "view_locomotive_passport",
    "view_duty_uzel",
    "view_inspections",
    "view_locomotive_passport_inspections",
    "create_locomotive_passport_inspection",
    "edit_locomotive_passport_inspection",
    "view_locomotive_replacement_oil",
    "create_locomotive_replacement_oil",
    "edit_locomotive_replacement_oil",
    "edit_inspection_location_section",
  ],
  sriv_admin: [
    "view_dashboard",
    "view_delays",
    "view_delays_reports",
    "create_delay",
    "edit_delay",
    "delete_delay",
    "filter_delay_station",

  ],
  sriv_moderator: ["view_delays", "edit_delay", "upload_delay_report"],
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
    case "delays": {
      return hasPermission(user, "view_delays");
    }
    case "delays-reports": {
      return hasPermission(user, "view_delays_reports");
    }
    case "depo": {
      return hasPermission(user, "view_depo");
    }
    case "duty_uzel": {
      return hasPermission(user, "view_duty_uzel");
    }
    case "locomotive_passport_inspections": {
      return hasPermission(user, "view_locomotive_passport_inspections");
    }
    case "replacement_schedule": {
      return hasPermission(user, "view_locomotive_replacement_oil");
    }
    case "inspections": {
      return hasPermission(user, "view_inspections");
    }
    default:
      return false;
  }
}
