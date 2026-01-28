import { User, LogOut, Bell, Settings } from "lucide-react";
import { Button } from "@/ui/button";
import { AccountPopover } from "./account-popover";
import { UserData } from "@/api/types/auth";
import { authService } from "@/api/services/auth.service";
import { LanguageSwitcher } from "@/components/language-switcher";

interface HeaderProps {
  user: UserData;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 bg-[#ffffff] border-b border-[#e5e7eb] px-6 flex items-center justify-between">
      <div className="flex-1 flex items-center">
        <LanguageSwitcher />
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#6b7280] hover:text-[#374151]"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* <Button
          variant="ghost"
          size="sm"
          className="text-[#6b7280] hover:text-[#374151]"
        >
          <Settings className="h-5 w-5" />
        </Button> */}

        {/* User avatar and name popover */}
        <AccountPopover user={user!} onLogout={authService.logout} />
        {/* 
        <Button
          variant="ghost"
          size="sm"
          className="text-[#6b7280] hover:text-[#374151]"
        >
          <LogOut className="h-5 w-5" />
        </Button> */}
      </div>
    </header>
  );
}
