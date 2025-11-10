"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Zap,
  Eye,
  FileText,
  AlertCircle,
  Paintbrush,
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

// Mock organizations data
const mockOrganizations = [
  { id: "1", name: "TCH-O`ZBEKISTON" },
  { id: "2", name: "Toshkent Shahar" },
  { id: "3", name: "Samarqand Viloyati" },
  { id: "4", name: "Buxoro Viloyati" },
  { id: "5", name: "Andijon Viloyati" },
];

const navigationItems = [
  {
    name: "Pantograf",
    href: "/pantograf",
    icon: Zap,
    section: "pantograf",
  },
  {
    name: "Avtostepka",
    href: "/autoconnecters",
    icon: Eye,
    section: "autoconnecters",
  },
  {
    name: "Buyruq MPR",
    href: "/orders",
    icon: FileText,
    section: "orders",
  },
  {
    name: "Nosozlik",
    href: "/defects",
    icon: AlertCircle,
    section: "defects",
  },
  {
    name: "Defektiv Ishlar",
    href: "/defective-works",
    icon: Paintbrush,
    section: "defective-works",
  },
  {
    name: "Stansiya",
    href: "/stations",
    icon: Settings,
    section: "stations",
  },
  {
    name: "Razzavor",
    href: "/reports",
    icon: RotateCw,
    section: "reports",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>(
    mockOrganizations[0].id
  );

  // Get user from localStorage on client side only
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  const filteredNavigationItems = user
    ? navigationItems.filter((navItem) =>
        canAccessSection(user, navItem.section)
      )
    : [];

  const selectedOrg = mockOrganizations.find(
    (org) => org.id === selectedOrganization
  );

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
                E-LABS.UZ
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                Raqamli Laboratoriya
              </div>
            </div>
          </div>

          {/* Organization Selector - Matching Figma specs exactly */}
          <Select
            value={selectedOrganization}
            onValueChange={setSelectedOrganization}
          >
            <SelectTrigger
              size="default"
              className={cn(
                "!w-full !bg-[#F1F5F9] !border !border-[#E2E8F0] !rounded-lg",
                "hover:!border-primary/50 focus:!border-primary focus:!ring-2 focus:!ring-primary/20",
                "!mb-0 !shadow-none justify-start",
                "!h-12 !min-h-12",
                "[&>svg:last-child]:!text-[#1E293B] [&>svg:last-child]:!w-4 [&>svg:last-child]:!h-4 [&>svg:last-child]:ml-auto [&>svg:last-child]:flex-shrink-0",
                "[&_*]:data-[slot=select-value]:!text-[#2B7FFF] [&_*]:data-[slot=select-value]:!font-medium"
              )}
            >
              {/* Frame container - icon and text with exact Figma specs */}
              <div
                className="flex items-center flex-1 min-w-0"
                style={{
                  gap: "12px",
                  height: "20px",
                  padding: 0,
                }}
              >
                {/* Icon - 20px × 20px, color #2B7FFF (Brand/50) */}
                <Building2
                  className="flex-shrink-0"
                  style={{
                    width: "20px",
                    height: "20px",
                    color: "#2B7FFF",
                  }}
                />
                {/* Text - Exact Figma specs */}
                <SelectValue
                  className="flex-1 text-left truncate"
                  style={{
                    fontFamily: "Inter",
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "20px",
                    letterSpacing: "-0.006em",
                    color: "#2B7FFF",
                  }}
                >
                  {selectedOrg?.name || "TCH-O`ZBEKISTON"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              {mockOrganizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation - Scrollable */}
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

        {/* Support Button and Footer - Fixed at bottom */}
        <div className="mt-auto pt-4 border-t border-sidebar-border flex-shrink-0">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mb-4 flex items-center justify-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Texnik yordam markazi</span>
          </Button>

          <div className="space-y-0.5 text-xs text-muted-foreground text-center">
            <div>E-labs.uz</div>
            <div>Raqamli Laboratoriya</div>
            <div>{new Date().getFullYear()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
