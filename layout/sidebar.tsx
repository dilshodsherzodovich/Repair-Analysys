"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Eye,
  FileText,
  AlertCircle,
  Settings,
  RotateCw,
  ChevronRight,
  Send,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessSection } from "@/lib/permissions";
import { UserData } from "@/api/types/auth";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { useOrganizations } from "@/api/hooks/use-organizations";
import { authService } from "@/api/services/auth.service";
import { PermissionGuard } from "@/components/permission-guard";

const navigationItems = [
  {
    name: "Pantograf",
    href: "/",
    icon: Zap,
    section: "pantograf",
  },
  {
    name: "Buyruq MPR",
    href: "/orders",
    icon: FileText,
    section: "orders",
  },
  {
    name: "Nosozliklar",
    href: "/defective-works",
    icon: AlertCircle,
    section: "defective-works",
  },
  {
    name: "Sriv",
    href: "/delays",
    icon: AlertCircle,
    section: "delays",
  },
  {
    name: "Sriv hisobotlar",
    href: "/delay-reports",
    icon: FileText,
    section: "delays",
  },
  // {
  //   name: "Stansiya",
  //   href: "/stations",
  //   icon: Settings,
  //   section: "stations",
  // },
  // {
  //   name: "Razzavor",
  //   href: "/reports",
  //   icon: RotateCw,
  //   section: "reports",
  // },
  // {
  //   name: "Avtostepka",
  //   href: "/autoconnecters",
  //   icon: Eye,
  //   section: "autoconnecters",
  // },
];

export function Sidebar() {
  const pathname = usePathname();

  const user = authService.getUser();

  const filteredNavigationItems = user
    ? navigationItems.filter((navItem) =>
        canAccessSection(user, navItem.section)
      )
    : [];

  return (
    <aside className="bg-white border-r border-sidebar-border h-full flex flex-col">
      <div className="h-full flex flex-col p-6 min-h-0">
        {/* Logo/Brand Section */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm leading-tight">
                Tamir Tahlili Tizimi
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                Raqamli tahlil
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg text-sm font-medium transition-all px-3 py-2.5",
                  isActive
                    ? "bg-brand text-primary"
                    : "text-muted-foreground hover:bg-muted"
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
                      "truncate",
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                </div>

                <ChevronRight
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-sidebar-border flex-shrink-0">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mb-4 flex items-center justify-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Texnik yordam markazi</span>
          </Button>

          <div className="space-y-0.5 text-xs text-muted-foreground text-center">
            <div>Smart Depo</div>
            <div>Raqamli tahliliy tizim</div>
            <div>{new Date().getFullYear()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
