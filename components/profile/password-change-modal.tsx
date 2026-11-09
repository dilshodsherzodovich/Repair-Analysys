"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Key, Eye, EyeOff, X, AlertCircle } from "lucide-react";
import { Label } from "@/ui/label";

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PasswordChangeData) => Promise<void>;
}

export function PasswordChangeModal({
  isOpen,
  onClose,
  onSubmit,
}: PasswordChangeModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user types
    if (passwordErrors.length > 0) {
      setPasswordErrors([]);
    }
  };

  const validatePasswordChange = (): boolean => {
    const errors: string[] = [];

    if (!passwordData.currentPassword) {
      errors.push("Joriy parolni kiriting");
    }

    if (!passwordData.newPassword) {
      errors.push("Yangi parolni kiriting");
    } else if (passwordData.newPassword.length < 8) {
      errors.push("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak");
    }

    if (!passwordData.confirmPassword) {
      errors.push("Parolni tasdiqlang");
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push("Parollar mos kelmaydi");
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.push("Yangi parol joriy paroldan farq qilishi kerak");
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validatePasswordChange()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      await onSubmit(passwordData);

      // Reset form on success
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors([]);
      onClose();
    } catch (error) {
      setPasswordErrors(["Parolni o'zgartirishda xatolik yuz berdi"]);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors([]);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">
            Parolni o'zgartirish
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-2">
              Joriy parol
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                placeholder="Joriy parolni kiriting"
                className="border-border pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-2">
              Yangi parol
            </Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) =>
                handlePasswordChange("newPassword", e.target.value)
              }
              placeholder="Yangi parolni kiriting"
              className="border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kamida 8 ta belgi
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <Label className="block text-sm font-medium text-muted-foreground mb-2">
              Parolni tasdiqlang
            </Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e) =>
                handlePasswordChange("confirmPassword", e.target.value)
              }
              placeholder="Parolni qayta kiriting"
              className="border-border"
            />
          </div>

          {/* Error Messages */}
          {passwordErrors.length > 0 && (
            <div className="space-y-2">
              {passwordErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-destructive-subtle border border-destructive/30 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isChangingPassword}
              className="flex-1"
            >
              {isChangingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></div>
                  O'zgartirilmoqda...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Parolni o'zgartirish
                </>
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isChangingPassword}
            >
              Bekor qilish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
