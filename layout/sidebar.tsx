"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { Button } from "@/ui/button";
import {
  authService } from "@/api/services/auth.service";
import { useTranslations } from "next-intl";
import { useOrganizations } from "@/api/hooks/use-organizations";

const navigationItems = [
  {
    key: "pantograph",
    href: "/",
    icon: Zap,
    section: "pantograf",
  },
  {
    key: "orders",
    href: "/orders",
    icon: FileText,
    section: "orders",
  },
  {
    key: "defective_works",
    href: "/defective-works",
    icon: AlertCircle,
    section: "defective-works",
  },
  {
    key: "delays",
    href: "/delays",
    icon: OctagonMinus,
    section: "delays",
  },
  {
    key: "delay_reports",
    href: "/delays/reports",
    icon: ClipboardMinus,
    section: "delays-reports",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const [depoExpanded, setDepoExpanded] = useState(true);

  const user = authService.getUser();
  const canAccessDepo = user ? canAccessSection(user, "depo") : false;
  const { data: organizationsData } = useOrganizations(
    canAccessDepo ? { no_page: true } : undefined
  );
  const organizations = Array.isArray(organizationsData)
    ? organizationsData
    : (organizationsData as { results?: { id: number; name: string }[] } | undefined)?.results ?? [];

  const filteredNavigationItems = user
    ? navigationItems.filter((navItem) =>
        canAccessSection(user, navItem.section)
      )
    : [];

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
          {/* Expandable Depo section */}
          {canAccessDepo && !isCollapsed && (
            <div className="mb-1">
              <button
                type="button"
                onClick={() => setDepoExpanded((prev) => !prev)}
                className={cn(
                  "flex items-center justify-between w-full rounded-t-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                  pathname.startsWith("/depo/")
                    ? "bg-brand text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FlaskConical
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      pathname.startsWith("/depo/")
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "truncate text-left",
                      pathname.startsWith("/depo/")
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {t("nav.depot")}
                  </span>
                </div>
                {depoExpanded ? (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      pathname.startsWith("/depo/")
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                ) : (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      pathname.startsWith("/depo/")
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                )}
              </button>
              <AnimatePresence initial={false}>
                {depoExpanded && organizations.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-b-lg bg-brand px-2 py-0">
                      {organizations.map((org) => {
                        const isChildActive = pathname === `/depo/${org.id}`;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => router.push(`/depo/${org.id}`)}
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
                                isChildActive
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              •
                            </span>
                            <span
                              className={cn(
                                "truncate",
                                isChildActive
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              {org.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Depo icon-only when collapsed */}
          {canAccessDepo && isCollapsed && (
            <Link
              href={
                pathname.startsWith("/depo/")
                  ? pathname
                  : organizations[0]
                    ? `/depo/${organizations[0].id}`
                    : "#"
              }
              className={cn(
                "flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all px-3 py-2.5",
                pathname.startsWith("/depo/")
                  ? "bg-brand text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={t("nav.depot")}
            >
              <FlaskConical className="h-5 w-5 flex-shrink-0" />
            </Link>
          )}

          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

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
                title={isCollapsed ? t(`nav.${item.key}` as any) : undefined}
              >
                <div className={cn("flex items-center flex-1 min-w-0", isCollapsed && "justify-center")}>
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span
                        className={cn(
                          "truncate ml-3",
                          isActive
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                        {t(`nav.${item.key}` as any)}
                      </span>
                    </>
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
