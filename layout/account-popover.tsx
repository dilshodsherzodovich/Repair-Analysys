"use client";

import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/ui/dropdown-menu";
import Link from "next/link";
import { UserData } from "@/api/types/auth";
import { useTranslations } from "next-intl";

interface AccountPopoverProps {
  user: UserData;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

export function AccountPopover({
  user,
  onProfile,
  onSettings,
  onLogout,
}: AccountPopoverProps) {
  const tRoles = useTranslations("Roles");
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center md:space-x-2 px-1 md:px-2 py-1 rounded-full md:rounded-lg hover:bg-[var(--primary)]/10"
        >
          <div className="w-9 h-9 md:w-8 md:h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-bold shrink-0">
            {(user.first_name && user.first_name[0]) ||
              (user.last_name && user.last_name[0]) ||
              user.username[0]?.toUpperCase() ||
              "U"}
          </div>
          <span className="hidden md:inline-block text-[var(--foreground)] font-medium text-left">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.username}
            <div className="text-xs text-[var(--muted-foreground)]">
              {user.role ? tRoles(user.role) : "User"}
            </div>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white shadow-lg border rounded-lg p-0"
      >
        <DropdownMenuLabel className="px-4 pt-3 pb-1">
          <div className="font-semibold text-[var(--foreground)]">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.username}
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {user.username}: {user.role ? tRoles(user.role) : "User"}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="px-4 py-2 flex items-center gap-2 text-red-600 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
