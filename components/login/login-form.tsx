"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import { useLogin } from "@/api/hooks/use-auth";
import { LoginCredentials } from "@/api/types/auth";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    username: "",
    password: "",
  });

  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      return;
    }

    // Navigation is handled in useLogin hook
    loginMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData((prev: LoginCredentials) => ({ ...prev, [field]: value }));
  };

  const handleError = (error: any) => {
    // Handle different error response formats from the API
    if (error.response?.data) {
      const errorData = error.response.data;

      // Check for detail field (common in Django REST Framework)
      if (errorData.detail) {
        return typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }

      // Check for non_field_errors (Django REST Framework validation errors)
      if (errorData.non_field_errors) {
        return Array.isArray(errorData.non_field_errors)
          ? errorData.non_field_errors[0]
          : errorData.non_field_errors;
      }

      // Check for message field
      if (errorData.message) {
        return typeof errorData.message === "string"
          ? errorData.message
          : errorData.message.detail || "Xatolik yuz berdi";
      }
    }

    // Fallback to error message
    return error.message || "Tizimga kirishda xatolik yuz berdi";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-semibold text-[#1f2937] mb-2">
          Ta'mir tahlili tizimi
        </CardTitle>
        <p className="text-[#6b7280] text-sm">
          Ta'mir tahlili tizimiga kirish uchun ma'lumotlaringizni kiriting
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-[#374151]"
            >
              Foydalanuvchi nomi
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] w-4 h-4" />
              <Input
                id="username"
                type="text"
                placeholder="Foydalanuvchi nomini kiriting"
                className="pl-10 h-12 bg-[#f9fafb] border-[#e5e7eb] focus:border-[#4978ce] focus:ring-[#4978ce]"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={loginMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-[#374151]"
            >
              Parol
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Parolni kiriting"
                className="pl-10 h-12 bg-[#f9fafb] border-[#e5e7eb] focus:border-[#4978ce] focus:ring-[#4978ce]"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={loginMutation.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loginMutation.isPending}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {loginMutation.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {handleError(loginMutation.error)}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              loginMutation.isPending ||
              !formData.username ||
              !formData.password
            }
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kirilmoqda...
              </>
            ) : (
              "Kirish"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
