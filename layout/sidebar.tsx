"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  FileText,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Send,
  Shield,
  OctagonMinus,
  ClipboardMinus,
  FlaskConical,
  Train,
  ClipboardCheck,
  ClipboardList,
  Calendar,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { Button } from "@/ui/button";
import {
  authService
} from "@/api/services/auth.service";
import { useTranslations } from "next-intl";
import { useOrganizations } from "@/api/hooks/use-organizations";
import type { UserData } from "@/api/types/auth";
import type { Organization } from "@/api/types/organizations";

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
  children?: NavChild[];
}

function formatOrgDisplayName(org: Organization): string {
  const name = org.name ?? "";
  if (
    name.includes("lokomotiv") ||
    name.includes("depo") ||
    name.includes("deposi")
  ) {
    return name.split(" ")[0].replaceAll(/"/g, "") + " depo";
  }
  return name;
}

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const user = authService.getUser();
  const { data: organizationsData } = useOrganizations(user ? { no_page: true } : undefined);
  const organizations: Organization[] = Array.isArray(organizationsData)
    ? organizationsData
    : (organizationsData as { results?: Organization[] } | undefined)?.results ?? [];

  const userBranchOrg = useMemo((): { id: number; name: string } | undefined => {
    if (!user) return undefined;
    const u = user as UserData & { branch?: number | { organization?: { id: number; name: string } } };
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

  const navigationItems: NavigationItem[] = useMemo(() => {
    const items: NavigationItem[] = [];

    if (user && canAccessSection(user, "pantograf")) {
      items.push({
        key: "pantograph",
        name: t("nav.pantograph"),
        icon: Zap,
        section: "pantograf",
        href: "/",
      });
    }

    if (user && canAccessSection(user, "orders")) {
      items.push({
        key: "orders",
        name: t("nav.orders"),
        icon: FileText,
        section: "orders",
        href: "/orders",
      });
    }

    if (user && canAccessSection(user, "defective-works")) {
      items.push({
        key: "defective_works",
        name: t("nav.defective_works"),
        icon: AlertCircle,
        section: "defective-works",
        href: "/defective-works",
      });
    }

    if (user && canAccessSection(user, "depo")) {
      const depoChildren: NavChild[] =
        user.role === "admin"
          ? (organizations
            ?.map((org) => ({
              name: formatOrgDisplayName(org),
              href: `/depo/${org.id}`,
            }))
            .filter((child): child is NavChild => Boolean(child.name)) ?? [])
          : userBranchOrg
            ? [
              {
                name: userBranchOrg.name,
                href: `/depo/${userBranchOrg.id}`,
              },
            ]
            : [];
      items.push({
        key: "depot",
        name: t("nav.depot"),
        icon: FlaskConical,
        section: "depo",
        children: depoChildren,
      });
    }

    if (user && canAccessSection(user, "duty_uzel")) {
      const dutyChildren: NavChild[] =
        user.role === "admin"
          ? (organizations
            ?.map((org) => {
              const firstWord = (org.name ?? "").split(" ")[0] ?? "";
              const name =
                (org.name ?? "").includes("lokomotiv") ||
                  (org.name ?? "").includes("depo") ||
                  (org.name ?? "").includes("deposi")
                  ? firstWord.replaceAll(/[^a-zA-Z0-9]/g, "") + " depo"
                  : org.name ?? "";
              return { name, href: `/duty-uzel/${org.id}` };
            })
            .filter((child): child is NavChild => Boolean(child.name)) ?? [])
          : userBranchOrg
            ? [
              {
                name: userBranchOrg.name,
                href: `/duty-uzel/${userBranchOrg.id}`,
              },
            ]
            : [];
      items.push({
        key: "duty_uzel",
        name: t("nav.duty_uzel"),
        icon: Train,
        section: "duty_uzel",
        children: dutyChildren,
      });
    }

    if (user && canAccessSection(user, "revision_journal")) {
      const revisionChildren: NavChild[] =
        user.role === "admin"
          ? (organizations
            ?.map((org) => ({
              name: formatOrgDisplayName(org),
              href: `/revision-journal/${org.id}`,
            }))
            .filter((child): child is NavChild => Boolean(child.name)) ?? [])
          : userBranchOrg
            ? [
              {
                name: userBranchOrg.name,
                href: `/revision-journal/${userBranchOrg.id}`,
              },
            ]
            : [];
      items.push({
        key: "revision_journal",
        name: t("nav.revision_journal"),
        icon: FileText,
        section: "revision_journal",
        children: revisionChildren,
      });
    }

    if (user && canAccessSection(user, "locomotive_passport_inspections")) {
      items.push({
        key: "locomotive_passport_inspections",
        name: t("nav.locomotive_passport_inspections"),
        icon: ClipboardCheck,
        section: "locomotive_passport_inspections",
        href: "/locomotive-passport-inspections",
      });
    }

    if (user && canAccessSection(user, "replacement_schedule")) {
      items.push({
        key: "replacement_schedule",
        name: t("nav.replacement_schedule"),
        icon: Calendar,
        section: "replacement_schedule",
        href: "/replacement-schedule",
      });
    }

    if (user && canAccessSection(user, "inspections")) {
      items.push({
        key: "inspections",
        name: t("nav.inspections"),
        icon: ClipboardList,
        section: "inspections",
        href: "/inspections",
      });
    }

    if (user && canAccessSection(user, "inspections")) {
      items.push({
        key: "locomotive_mileage_report",
        name: t("nav.locomotive_mileage_report"),
        icon: Gauge,
        section: "inspections",
        href: "/locomotive-mileage-report",
      });
    }

    if (user && canAccessSection(user, "delays")) {
      items.push({
        key: "delays",
        name: t("nav.delays"),
        icon: OctagonMinus,
        section: "delays",
        href: "/delays",
      });
    }

    if (user && canAccessSection(user, "delays-reports")) {
      items.push({
        key: "delay_reports",
        name: t("nav.delay_reports"),
        icon: ClipboardMinus,
        section: "delays-reports",
        href: "/delays/reports",
      });
    }

    return items;
  }, [user, organizations, userBranchOrg, t]);

  const toggleSection = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const isSectionActive = (item: NavigationItem) => {
    if (item.href) return pathname === item.href;
    if (item.children?.length) {
      const basePath = item.children[0].href.split("/")[1];
      return pathname.startsWith(`/${basePath}/`);
    }
    return false;
  };

  return (
    <aside className="h-full flex flex-col">
      <div className="h-full flex flex-col min-h-0 flex-1 p-3 md:p-4">
        {/* Logo/Brand Section */}
        <div className="mb-4 flex-shrink-0">
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-3")}>
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

        <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isActive = isSectionActive(item);
            const isExpanded = expandedKey === item.key;

            if (hasChildren && !isCollapsed) {
              return (
                <div key={item.key} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleSection(item.key)}
                    className={cn(
                      "flex items-center justify-between w-full rounded-t-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                      isActive
                        ? "bg-brand text-primary"
                        : "text-muted-foreground"
                      , isExpanded && "bg-brand"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-left",
                          isActive ? "text-primary font-semibold" : "text-muted-foreground"
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
                        <div className="rounded-b-lg bg-brand px-2 py-0">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <button
                                key={child.href}
                                type="button"
                                onClick={() => router.push(child.href)}
                                className={cn(
                                  "flex w-full items-center rounded-lg text-sm transition-all px-3 py-2 cursor-pointer",
                                  isChildActive
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground hover:text-primary"
                                )}
                              >
                                <span
                                  className={cn(
                                    "mr-2 text-sm leading-none",
                                    isChildActive ? "text-primary" : "text-muted-foreground"
                                  )}
                                >
                                  •
                                </span>
                                <span
                                  className={cn(
                                    "truncate",
                                    isChildActive ? "text-primary" : "text-muted-foreground"
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
              const currentChild = item.children!.find((c) => c.href === pathname) ?? firstChild;
              return (
                <Link
                  key={item.key}
                  href={currentChild.href}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                    isActive ? "bg-brand text-primary" : "text-muted-foreground hover:bg-muted"
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
                      ? "bg-brand text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div
                    className={cn(
                      "flex items-center flex-1 min-w-0",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <span
                        className={cn(
                          "truncate ml-3",
                          isActive ? "text-primary font-semibold" : "text-muted-foreground"
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
                        isActive ? "text-primary" : "text-muted-foreground"
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
              isCollapsed ? "p-2" : "space-x-2 py-2"
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
