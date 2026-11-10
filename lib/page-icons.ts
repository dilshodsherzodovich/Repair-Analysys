import {
  AlertCircle,
  Banknote,
  Calendar,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  ClipboardMinus,
  Clock,
  Cog,
  Disc,
  FileBarChart,
  FileCheck,
  FileText,
  FormInput,
  Gauge,
  History,
  LayoutDashboard,
  OctagonMinus,
  Palette,
  RotateCw,
  Satellite,
  Timer,
  Train,
  Truck,
  Users,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon per page, shared by the sidebar and every PageHeader so a page
 * always looks the same in both places. Keys are path prefixes; org-scoped
 * routes (/bandages/12) match their section.
 */
export const PAGE_ICONS: Record<string, LucideIcon> = {
  "/": Zap,
  "/orders": FileText,
  "/defective-works": AlertCircle,
  "/depo": FormInput,
  "/bandages": Disc,
  "/crankshaft": Cog,
  "/duty-uzel": Train,
  "/revision-journal": FileText,
  "/locomotive-passport-inspections": ClipboardCheck,
  "/replacement-schedule": Calendar,
  "/inspections": ClipboardList,
  "/annual-inspection-plan": CalendarRange,
  "/locomotive-mileage-report": Gauge,
  "/rezerv": ClipboardList,
  "/delays": OctagonMinus,
  "/delays/reports": ClipboardMinus,
  "/delays/payment-report": Banknote,
  "/culprits": Users,
  "/recovery": Wallet,
  "/razvarot": RotateCw,
  "/tu-137": ClipboardList,
  "/tu-152": ClipboardList,
  "/tu152-journal": ClipboardList,
  // Reports: one group in the sidebar, a distinct icon per report
  "/reports": Truck,
  "/unified-inspection-report": LayoutDashboard,
  "/delayed-report": Clock,
  "/txk2-report": Wrench,
  "/inspection-report": FileCheck,
  "/delayed-repair-duration-report": Timer,
  "/locomotive-history": History,
  "/locomotive-gps-report": Satellite,
  "/ui-kit": Palette,
};

/** The reports group's own icon in the sidebar. */
export const REPORTS_GROUP_ICON: LucideIcon = FileBarChart;

/** Icon for a path: the longest matching prefix, or undefined. */
export function pageIcon(pathname: string): LucideIcon | undefined {
  if (pathname === "/") return PAGE_ICONS["/"];
  let best: string | undefined;
  for (const prefix of Object.keys(PAGE_ICONS)) {
    if (prefix === "/") continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!best || prefix.length > best.length) best = prefix;
    }
  }
  return best ? PAGE_ICONS[best] : undefined;
}
