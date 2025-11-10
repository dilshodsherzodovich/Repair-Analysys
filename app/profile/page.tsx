"use client";

import { useState } from "react";
import { Card } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Shield,
  Settings,
  Edit3,
  Save,
  X,
  Camera,
  Key,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { PasswordChangeModal } from "@/components/profile/password-change-modal";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  organization: string;
  location: string;
  joinDate: string;
  lastLogin: string;
  status: "active" | "inactive";
  role: "admin" | "operator" | "viewer";
  avatar?: string;
  organizations: string[];
  departments: string[];
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: "1",
    firstName: "Anvar",
    lastName: "Umarov",
    email: "anvar.umarov@example.com",
    phone: "+998 90 123 45 67",
    position: "Statistika boshqaruvchisi",
    department: "Monitoring va hisobotlar",
    organization: "E-BYULLETEN tizimi",
    location: "Toshkent, O'zbekiston",
    joinDate: "15.01.2024",
    lastLogin: "Bugun, 14:30",
    status: "active",
    role: "operator",
    avatar: undefined,
    organizations: [
      "E-BYULLETEN tizimi",
      "Statistika boshqarmasi",
      "Monitoring markazi",
    ],
    departments: [
      "Monitoring va hisobotlar",
      "Ma'lumotlar boshqaruvi",
      "Tizim administratori",
    ],
  });

  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
  });

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
    });
  };

  const handleSave = () => {
    setProfile({
      ...profile,
      ...formData,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = async (passwordData: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Show success message (you can implement a toast notification here)
    alert("Parol muvaffaqiyatli o'zgartirildi!");
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      admin: "Administrator",
      operator: "Operator",
      viewer: "Ko'ruvchi",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: "bg-red-100 text-red-800 border-red-200",
      operator: "bg-blue-100 text-blue-800 border-blue-200",
      viewer: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Foydalanuvchi profili
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Shaxsiy ma'lumotlar va sozlamalar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Sozlamalar
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Bildirishnomalar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Profile Info */}
          <Card className="p-6 border-[var(--border)] rounded-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage
                      src={profile.avatar}
                      alt={`${profile.firstName} ${profile.lastName}`}
                    />
                    <AvatarFallback className="text-2xl font-bold bg-[var(--primary)] text-white">
                      {profile.firstName.charAt(0)}
                      {profile.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 p-2 h-8 w-8 rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-[var(--muted-foreground)] text-lg">
                    {profile.position}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getRoleColor(profile.role)}>
                      {getRoleLabel(profile.role)}
                    </Badge>
                    <Badge className={getStatusColor(profile.status)}>
                      {profile.status === "active" ? "Faol" : "Nofaol"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleEdit}
                variant="outline"
                className={isEditing ? "hidden" : ""}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Tahrirlash
              </Button>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Ism
                </label>
                {isEditing ? (
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="border-[var(--border)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg">
                    <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]">
                      {profile.firstName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Familiya
                </label>
                {isEditing ? (
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="border-[var(--border)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg">
                    <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]">
                      {profile.lastName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    type="email"
                    className="border-[var(--border)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg">
                    <Mail className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]">
                      {profile.email}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Telefon
                </label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border-[var(--border)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg">
                    <Phone className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]">
                      {profile.phone}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Manzil
                </label>
                {isEditing ? (
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="border-[var(--border)]"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg">
                    <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]">
                      {profile.location}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Quyi tashkilot
                </label>
                <div className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg">
                  <Building2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--foreground)]">
                    {profile.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--border)]">
                <Button
                  onClick={handleSave}
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Saqlash
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Bekor qilish
                </Button>
              </div>
            )}
          </Card>

          {/* Organizations & Departments */}
          <Card className="p-6 border-[var(--border)] rounded-xl">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
              Tashkilotlar va Quyi tashkilotlar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organizations */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-[var(--primary)]" />
                  <h4 className="font-semibold text-[var(--foreground)]">
                    Tashkilotlar
                  </h4>
                </div>
                <div className="space-y-2">
                  {profile.organizations.map((org, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-[var(--foreground)]">{org}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-[var(--primary)]" />
                  <h4 className="font-semibold text-[var(--foreground)]">
                    Quyi tashkilotlar
                  </h4>
                </div>
                <div className="space-y-2">
                  {profile.departments.map((dept, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-[var(--muted)]/20 rounded-lg"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-[var(--foreground)]">{dept}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Work Information */}
          <Card className="p-6 border-[var(--border)] rounded-xl">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
              Ish ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/20 rounded-lg">
                <Building2 className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Tashkilot
                  </p>
                  <p className="font-medium text-[var(--foreground)]">
                    {profile.organization}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/20 rounded-lg">
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Qo'shilgan sana
                  </p>
                  <p className="font-medium text-[var(--foreground)]">
                    {profile.joinDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/20 rounded-lg">
                <Globe className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Oxirgi kirish
                  </p>
                  <p className="font-medium text-[var(--foreground)]">
                    {profile.lastLogin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/20 rounded-lg">
                <Shield className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Huquq darajasi
                  </p>
                  <p className="font-medium text-[var(--foreground)]">
                    {getRoleLabel(profile.role)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Settings */}
          <Card className="p-6 border-[var(--border)] rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Xavfsizlik
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowPasswordModal(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Parolni o'zgartirish
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Lock className="w-4 h-4 mr-2" />
                Ikki bosqichli autentifikatsiya
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                Faol sessiyalar
              </Button>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6 border-[var(--border)] rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Sozlamalar
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Bildirishnomalar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Til va mintaqa
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Boshqa sozlamalar
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 border-[var(--border)] rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Faollik statistikasi
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Bugungi kirishlar
                </span>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Haftalik faollik
                </span>
                <Badge variant="secondary">85%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Oylik faollik
                </span>
                <Badge variant="secondary">92%</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordChange}
      />
    </div>
  );
}
