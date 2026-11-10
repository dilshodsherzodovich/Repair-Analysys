"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronDown, Send, Shield, type LucideIcon, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { authService } from "@/api/services/auth.service";
import { useTranslations } from "next-intl";
import { useOrganizations } from "@/api/hooks/use-organizations";
import type { UserData } from "@/api/types/auth";
import type { Organization } from "@/api/types/organizations";
import { PAGE_ICONS, REPORTS_GROUP_ICON } from "@/lib/page-icons";

interface NavChild {
  name: string;
  href: string;
}

interface NavigationItem {
  key: string;
  name: string;
  icon: LucideIcon;
  section: string;
  href?: string;
  /** Org-scoped links stay active on every page under this path */
  activePrefix?: string;
  children?: NavChild[];
}

/** Pages that belong to one organization: /{section}/{orgId}/... */
const ORG_ROUTE =
  /^\/(depo|bandages|crankshaft|duty-uzel|revision-journal)\/(\d+)(?:\/|$)/;
const ORG_STORAGE_KEY = "sidebar_organization";

/**
 * The role set most report pages share in dejurniy, expressed there as a list
 * of exclusions. Kept as one predicate so the seven children below don't repeat
 * a nine-term condition each.
 */
const REPORTS_GENERAL_ROLES = (role: string) =>
  role !== "dispatcher" &&
  role !== "teplo_texnik" &&
  role !== "operator" &&
  role !== "payroll" &&
  role !== "repair_staff" &&
  role !== "repair_engineer" &&
  role !== "rb" &&
  role !== "rb_admin" &&
  role !== "hr";

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const user = authService.getUser();
  const { data: organizationsData } = useOrganizations(
    user ? { no_page: true } : undefined,
  );
  const organizations: Organization[] = Array.isArray(organizationsData)
    ? organizationsData
    : ((organizationsData as { results?: Organization[] } | undefined)
        ?.results ?? []);

  const userBranchOrg = useMemo(():
    | { id: number; name: string }
    | undefined => {
    if (!user) return undefined;
    const u = user as UserData & {
      branch?: number | { organization?: { id: number; name: string } };
    };
    const branch = u.branch;
    if (branch != null && typeof branch === "object") {
      const b = branch as { organization?: { id: number; name: string } };
      return b.organization;
    }
    if (typeof branch === "number") {
      const org = organizations.find((o) => o.id === branch);
      return org ? { id: org.id, name: org.name } : undefined;
    }
    return undefined;
  }, [user, organizations]);

  // Admins pick the organization once above the menu; everyone else always
  // works with their own branch's organization
  const isAdmin = user?.role === "admin";
  const routeOrgId = useMemo(() => {
    const match = pathname.match(ORG_ROUTE);
    return match ? Number(match[2]) : undefined;
  }, [pathname]);
  const [storedOrgId, setStoredOrgId] = useState<number | undefined>();

  useEffect(() => {
    try {
      setStoredOrgId(Number(localStorage.getItem(ORG_STORAGE_KEY)) || undefined);
    } catch {
      // Storage unavailable; fall back to the branch organization
    }
  }, []);

  // Opening an org page directly (link, bookmark) also selects that organization
  useEffect(() => {
    if (!isAdmin || !routeOrgId) return;
    setStoredOrgId(routeOrgId);
    try {
      localStorage.setItem(ORG_STORAGE_KEY, String(routeOrgId));
    } catch {
      // Not persisted; the selection still holds for this visit
    }
  }, [isAdmin, routeOrgId]);

  const selectedOrgId = isAdmin
    ? (routeOrgId ??
      storedOrgId ??
      userBranchOrg?.id ??
      organizations[0]?.id)
    : userBranchOrg?.id;

  const pickerOrgs = isAdmin
    ? organizations
    : userBranchOrg
      ? [userBranchOrg]
      : [];

  const handleOrgChange = (value: string) => {
    const orgId = Number(value);
    setStoredOrgId(orgId);
    try {
      localStorage.setItem(ORG_STORAGE_KEY, String(orgId));
    } catch {
      // Not persisted; the selection still holds for this visit
    }
    // On an org page, switch it to the new organization
    const match = pathname.match(ORG_ROUTE);
    if (match && Number(match[2]) !== orgId) {
      router.push(`/${match[1]}/${orgId}`);
    }
  };

  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [];

    if (user && canAccessSection(user, "pantograf")) {
      items.push({
        key: "pantograph",
        name: t("nav.pantograph"),
        icon: PAGE_ICONS["/"],
        section: "pantograf",
        href: "/",
      });
    }

    if (user && canAccessSection(user, "orders")) {
      items.push({
        key: "orders",
        name: t("nav.orders"),
        icon: PAGE_ICONS["/orders"],
        section: "orders",
        href: "/orders",
      });
    }

    if (user && canAccessSection(user, "defective-works")) {
      items.push({
        key: "defective_works",
        name: t("nav.defective_works"),
        icon: PAGE_ICONS["/defective-works"],
        section: "defective-works",
        href: "/defective-works",
      });
    }

    // One link per section, opening the organization picked above the menu
    const orgHref = (basePath: string) =>
      selectedOrgId ? `${basePath}/${selectedOrgId}` : undefined;

    if (user && canAccessSection(user, "depo") && orgHref("/depo")) {
      items.push({
        key: "depot",
        name: t("nav.depot"),
        icon: PAGE_ICONS["/depo"],
        section: "depo",
        href: orgHref("/depo"),
        activePrefix: "/depo",
      });
    }

    if (user && canAccessSection(user, "depo") && selectedOrgId) {
      items.push({
        key: "bandages",
        name: t("nav.bandages"),
        icon: PAGE_ICONS["/bandages"],
        section: "depo",
        href: orgHref("/bandages"),
        activePrefix: "/bandages",
      });
      items.push({
        key: "crankshaft",
        name: t("nav.crankshaft"),
        icon: PAGE_ICONS["/crankshaft"],
        section: "depo",
        href: orgHref("/crankshaft"),
        activePrefix: "/crankshaft",
      });
    }

    if (user && canAccessSection(user, "duty_uzel") && selectedOrgId) {
      items.push({
        key: "duty_uzel",
        name: t("nav.duty_uzel"),
        icon: PAGE_ICONS["/duty-uzel"],
        section: "duty_uzel",
        href: orgHref("/duty-uzel"),
        activePrefix: "/duty-uzel",
      });
    }

    if (user && canAccessSection(user, "revision_journal") && selectedOrgId) {
      items.push({
        key: "revision_journal",
        name: t("nav.revision_journal"),
        icon: PAGE_ICONS["/revision-journal"],
        section: "revision_journal",
        href: orgHref("/revision-journal"),
        activePrefix: "/revision-journal",
      });
    }

    if (user && canAccessSection(user, "locomotive_passport_inspections")) {
      items.push({
        key: "locomotive_passport_inspections",
        name: t("nav.locomotive_passport_inspections"),
        icon: PAGE_ICONS["/locomotive-passport-inspections"],
        section: "locomotive_passport_inspections",
        href: "/locomotive-passport-inspections",
      });
    }

    if (user && canAccessSection(user, "replacement_schedule")) {
      items.push({
        key: "replacement_schedule",
        name: t("nav.replacement_schedule"),
        icon: PAGE_ICONS["/replacement-schedule"],
        section: "replacement_schedule",
        href: "/replacement-schedule",
      });
    }

    if (user && canAccessSection(user, "inspections")) {
      items.push({
        key: "inspections",
        name: t("nav.inspections"),
        icon: PAGE_ICONS["/inspections"],
        section: "inspections",
        href: "/inspections",
      });
    }

    if (user && canAccessSection(user, "inspections")) {
      items.push({
        key: "annual_inspection_plan",
        name: t("nav.annual_inspection_plan"),
        icon: PAGE_ICONS["/annual-inspection-plan"],
        section: "inspections",
        href: "/annual-inspection-plan",
      });
    }

    if (user && canAccessSection(user, "inspections")) {
      items.push({
        key: "locomotive_mileage_report",
        name: t("nav.locomotive_mileage_report"),
        icon: PAGE_ICONS["/locomotive-mileage-report"],
        section: "inspections",
        href: "/locomotive-mileage-report",
      });
    }

    if (user && canAccessSection(user, "inspections")) {
      items.push({
        key: "rezerv",
        name: t("nav.rezerv"),
        icon: PAGE_ICONS["/rezerv"],
        section: "inspections",
        href: "/rezerv",
      });
    }

    if (user && canAccessSection(user, "delays")) {
      items.push({
        key: "delays",
        name: t("nav.delays"),
        icon: PAGE_ICONS["/delays"],
        section: "delays",
        href: "/delays",
      });
    }

    if (user && canAccessSection(user, "delays-reports")) {
      items.push({
        key: "delay_reports",
        name: t("nav.delay_reports"),
        icon: PAGE_ICONS["/delays/reports"],
        section: "delays-reports",
        href: "/delays/reports",
      });
    }

    if (user && canAccessSection(user, "sriv-payment-report")) {
      items.push({
        key: "sriv_payment_report",
        name: t("nav.sriv_payment_report"),
        icon: PAGE_ICONS["/delays/payment-report"],
        section: "sriv-payment-report",
        href: "/delays/payment-report",
      });
    }

    if (user && canAccessSection(user, "culprits")) {
      items.push({
        key: "culprits",
        name: t("nav.culprits"),
        icon: PAGE_ICONS["/culprits"],
        section: "culprits",
        href: "/culprits",
      });
    }

    if (user && canAccessSection(user, "recovery")) {
      items.push({
        key: "recovery",
        name: t("nav.recovery"),
        icon: PAGE_ICONS["/recovery"],
        section: "recovery",
        href: "/recovery",
      });
    }

    if (user && canAccessSection(user, "razvarot")) {
      items.push({
        key: "razvarot",
        name: t("nav.razvarot"),
        icon: PAGE_ICONS["/razvarot"],
        section: "razvarot",
        href: "/razvarot",
      });
    }

    if (user && canAccessSection(user, "tu-137")) {
      items.push({
        key: "tu-137",
        name: t("nav.tu-137"),
        icon: PAGE_ICONS["/tu-137"],
        section: "tu-137",
        children: [
          { name: t("nav.tu-137"), href: "/tu-137" },
          { name: t("nav.tu-137-reports"), href: "/tu-137/reports" },
        ],
      });
    }

    if (user && canAccessSection(user, "tu-152")) {
      items.push({
        key: "tu-152",
        name: t("nav.tu-152"),
        icon: PAGE_ICONS["/tu-152"],
        section: "tu-152",
        href: "/tu-152",
      });
    }

    if (user && canAccessSection(user, "tu152-journal")) {
      items.push({
        key: "tu152-journal",
        name: t("nav.tu152-journal"),
        icon: PAGE_ICONS["/tu152-journal"],
        section: "tu152-journal",
        href: "/tu152-journal",
      });
    }

    // Reports — role gating mirrors the dejurniy project, which owns the same
    // endpoints. Roles it excludes that do not exist here (dispatcher, rb,
    // tchzr, …) simply never match, so the checks stay a faithful copy.
    const role = user?.role ?? "";
    const reportsChildren: NavChild[] = [];
    if (REPORTS_GENERAL_ROLES(role)) {
      reportsChildren.push({ name: t("nav.reports"), href: "/reports" });
    }
    // The unified report summarises the three below it, so it leads the menu.
    if (role === "admin") {
      reportsChildren.push({
        name: t("nav.unified_inspection_report"),
        href: "/unified-inspection-report",
      });
    }
    if (role === "admin" || role === "tchzr") {
      reportsChildren.push({
        name: t("nav.delayed_report"),
        href: "/delayed-report",
      });
    }
    if (REPORTS_GENERAL_ROLES(role)) {
      reportsChildren.push({
        name: t("nav.txk2_report"),
        href: "/txk2-report",
      });
    }
    if (
      role === "admin" ||
      role === "dispatcher" ||
      role === "moderator" ||
      role === "tchzr"
    ) {
      reportsChildren.push({
        name: t("nav.inspection_report"),
        href: "/inspection-report",
      });
    }
    if (REPORTS_GENERAL_ROLES(role)) {
      reportsChildren.push({
        name: t("nav.delayed_repair_duration_report"),
        href: "/delayed-repair-duration-report",
      });
      reportsChildren.push({
        name: t("nav.locomotive_history"),
        href: "/locomotive-history",
      });
    }
    if (
      role === "admin" ||
      role === "dejurniy" ||
      role === "moderator" ||
      role === "dispatcher" ||
      role === "tchzr"
    ) {
      reportsChildren.push({
        name: t("nav.locomotive_gps_report"),
        href: "/locomotive-gps-report",
      });
    }

    if (user && reportsChildren.length > 0) {
      items.push({
        key: "reports",
        name: t("nav.reports"),
        icon: REPORTS_GROUP_ICON,
        section: "reports",
        children: reportsChildren,
      });
    }

    return items;
  }, [user, selectedOrgId, t]);

  const toggleSection = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const isSectionActive = (item: NavigationItem) => {
    if (item.activePrefix) {
      return (
        pathname === item.activePrefix ||
        pathname.startsWith(`${item.activePrefix}/`)
      );
    }
    if (item.href) return pathname === item.href;
    // Match against every child, not just the first: the Reports group's
    // children each live at their own top-level path, unlike depo/tu-137 where
    // they share one. Equivalent for those, since all their children agree.
    return (item.children ?? []).some((child) => {
      const basePath = child.href.split("/")[1];
      return (
        pathname === `/${basePath}` || pathname.startsWith(`/${basePath}/`)
      );
    });
  };

  return (
    <aside className="h-full flex flex-col">
      <div className="h-full flex flex-col min-h-0 flex-1 p-3 md:p-4">
        {/* Logo/Brand Section */}
        <div className="mb-4 flex-shrink-0">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "space-x-3",
            )}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-foreground text-sm leading-tight truncate">
                  {t("brand_title")}
                </div>
                <div className="text-xs text-muted-foreground leading-tight truncate">
                  {t("brand_subtitle")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admins switch organization here; everyone else sees their own, read-only */}
        {!isCollapsed && pickerOrgs.length > 0 && (
          <div className="mb-4 flex-shrink-0 space-y-1.5 border-b border-sidebar-border">
            <div className="px-1 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("organization_label")}
            </div>
            <Select
              value={selectedOrgId ? String(selectedOrgId) : undefined}
              onValueChange={handleOrgChange}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-full disabled:cursor-default disabled:opacity-100">
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    <SelectValue />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {pickerOrgs.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isActive = isSectionActive(item);
            const isExpanded = expandedKey === item.key;

            if (hasChildren && !isCollapsed) {
              return (
                <div key={item.key} className="mb-1">
                  {/* kit-allow: app shell navigation item */}
                  <button
                    type="button"
                    onClick={() => toggleSection(item.key)}
                    className={cn(
                      "flex items-center justify-between w-full rounded-t-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                      isActive
                        ? "bg-primary-subtle text-primary"
                        : "text-muted-foreground",
                      isExpanded && "bg-primary-subtle",
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-left",
                          isActive
                            ? "text-primary font-semibold"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && item.children!.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-b-lg bg-primary-subtle px-2 py-0">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              // kit-allow: app shell navigation item
                              <button
                                key={child.href}
                                type="button"
                                onClick={() => router.push(child.href)}
                                className={cn(
                                  "flex w-full items-center rounded-lg text-sm transition-all px-3 py-2 cursor-pointer",
                                  isChildActive
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground hover:text-primary",
                                )}
                              >
                                <span
                                  className={cn(
                                    "mr-2 text-sm leading-none",
                                    isChildActive
                                      ? "text-primary"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  •
                                </span>
                                <span
                                  className={cn(
                                    "truncate",
                                    isChildActive
                                      ? "text-primary"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {child.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            if (hasChildren && isCollapsed) {
              const firstChild = item.children![0];
              const currentChild =
                item.children!.find((c) => c.href === pathname) ?? firstChild;
              return (
                <Link
                  key={item.key}
                  href={currentChild.href}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  title={item.name}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </Link>
              );
            }

            if (item.href) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                    isCollapsed ? "justify-center" : "justify-between",
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div
                    className={cn(
                      "flex items-center flex-1 min-w-0",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    {!isCollapsed && (
                      <span
                        className={cn(
                          "truncate ml-3",
                          isActive
                            ? "text-primary font-semibold"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  )}
                </Link>
              );
            }

            return null;
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-sidebar-border flex-shrink-0 space-y-3">
          <Button
            className={cn(
              "w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center",
              isCollapsed ? "p-2" : "space-x-2 py-2",
            )}
            title={isCollapsed ? t("support_button") : undefined}
          >
            <Send className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>{t("support_button")}</span>}
          </Button>

          {!isCollapsed && (
            <div className="space-y-0.5 text-xs text-muted-foreground text-center">
              <div>{t("footer_company")}</div>
              <div>{t("footer_description")}</div>
              <div>{new Date().getFullYear()}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
