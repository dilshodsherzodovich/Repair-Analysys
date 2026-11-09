"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import { Button } from "@/ui/button";

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export interface SidebarUser {
  name: string;
  role: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  user?: SidebarUser;
  className?: string;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ items, user, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full bg-white", className)}
        {...props}
      >
        {/* User Info Header */}
        {user && (
          <div className="p-4 border-b border-border bg-surface-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">({user.role})</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.active
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export { Sidebar };
