"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Building2,
  Calendar,
  Target,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
} from "recharts";
import {
  useMonitoring,
  useGetNearDeadlineMonitoring,
} from "@/api/hooks/use-monitoring";
import { MonitoringOrganization } from "@/api/types/monitoring";
import { Table, TableBody, TableHead } from "@/ui/table";
import { authService } from "@/api/services/auth.service";
import router from "next/router";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";

interface StatusData {
  onTime: number;
  delayed: number;
  noData: number;
  total: number;
}

interface OrganizationStatus {
  id: string;
  name: string;
  status: "onTime" | "delayed" | "noData";
  completed: number;
  total: number;
  percentage: number;
}

interface MonitoringData {
  organization: string;
  total: number;
  updated: number;
  pending: number;
  overdue: number;
  updatedAfterDeadline: number;
}

interface ChancelleryData {
  organization: string;
  total: number;
  totalOrganizations: number;
  sentToOrganizations: number;
  percentage: number;
  bulletins: {
    name: string;
    total: number;
    sent: number;
    percentage: number;
  }[];
}

export default function MonitoringPage() {
  const { data: monitoring, isLoading, error, refetch } = useMonitoring();

  // Modal state for near-deadline bulletins
  const [nearDeadlineOpen, setNearDeadlineOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedOrgName, setSelectedOrgName] = useState<string>("");

  const { data: nearDeadlineData, isLoading: nearLoading } =
    useGetNearDeadlineMonitoring(selectedOrgId || "");
  const nearDeadlineJournals = useMemo(() => {
    const data: any = nearDeadlineData as any;
    const list = data?.sec_org_journals;
    return Array.isArray(list) ? list : [];
  }, [nearDeadlineData]);

  // Transform API data to match component interfaces
  const statusData: StatusData = {
    onTime: monitoring?.results.total_stats.on_time_percentage || 0,
    delayed: monitoring?.results.total_stats.late_percentage || 0,
    noData: monitoring?.results.total_stats.missed_percentage || 0,
    total: 100,
  };

  const getStatusFromPercentages = (
    org: MonitoringOrganization
  ): "onTime" | "delayed" | "noData" => {
    if (
      org.on_time_percentage > org.late_percentage &&
      org.on_time_percentage > org.missed_percentage
    ) {
      return "onTime";
    } else if (org.late_percentage > org.missed_percentage) {
      return "delayed";
    } else {
      return "noData";
    }
  };

  const organizations: OrganizationStatus[] =
    monitoring?.results.organizations.map((org) => ({
      id: org.id,
      name: org.name,
      status: getStatusFromPercentages(org),
      completed: org.on_time_count,
      total: org.total_count,
      percentage: org.on_time_percentage,
    })) || [];

  // Safe array for organizations list used in table rendering
  const orgRows = useMemo(() => {
    const list: any = (monitoring as any)?.results?.organizations;
    return Array.isArray(list) ? list : [];
  }, [monitoring]);

  const monitoringTableData: MonitoringData[] =
    monitoring?.results.organizations.map((org) => ({
      organization: org.name,
      total: org.total_count,
      updated: org.on_time_count,
      pending: org.near_due_date_count,
      overdue: org.missed_count,
      updatedAfterDeadline: org.late_count,
    })) || [];

  // Chart data preparation
  const pieChartData = [
    {
      name: "O'z vaqtida yangilangan",
      value: statusData.onTime,
      color: "#10b981",
    },
    { name: "Kechiktirilgan", value: statusData.delayed, color: "#f59e0b" },
    { name: "Ma'lumot yo'q", value: statusData.noData, color: "#ef4444" },
  ];

  const barChartData = organizations.slice(0, 8).map((org) => ({
    name: org.name.length > 20 ? org.name.substring(0, 20) + "..." : org.name,
    completed: org.completed,
    total: org.total,
    percentage: org.percentage,
  }));

  const lineChartData = [
    { month: "Yanvar", updated: 65, pending: 25, overdue: 10 },
    { month: "Fevral", updated: 70, pending: 20, overdue: 10 },
    { month: "Mart", updated: 75, pending: 15, overdue: 10 },
    { month: "Aprel", updated: 80, pending: 15, overdue: 5 },
    { month: "May", updated: 85, pending: 10, overdue: 5 },
    { month: "Iyun", updated: 90, pending: 8, overdue: 2 },
  ];

  const areaChartData = [
    { month: "Yanvar", onTime: 60, delayed: 30, noData: 10 },
    { month: "Fevral", onTime: 65, delayed: 25, noData: 10 },
    { month: "Mart", onTime: 70, delayed: 20, noData: 10 },
    { month: "Aprel", onTime: 75, delayed: 20, noData: 5 },
    { month: "May", onTime: 80, delayed: 15, noData: 5 },
    { month: "Iyun", onTime: 85, delayed: 10, noData: 5 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "onTime":
        return "bg-green-100 text-green-800 border-green-200";
      case "delayed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "noData":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "onTime":
        return <CheckCircle className="w-4 h-4" />;
      case "delayed":
        return <Clock className="w-4 h-4" />;
      case "noData":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "onTime":
        return "O'z vaqtida yangilangan";
      case "delayed":
        return "Kechiktirilgan";
      case "noData":
        return "Ma'lumot kiritilmagan";
      default:
        return "Noma'lum";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[var(--border)] rounded-lg shadow-lg">
          <p className="font-medium text-[var(--foreground)]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportOrganizationsStatusToExcel = () => {
    const rows = organizations.map((org) => ({
      Tashkilot: org.name,
      Holat: getStatusLabel(org.status),
      Bajarilgan: org.completed,
      Jami: org.total,
      "%": org.percentage,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto width
    const colWidths = Object.keys(rows[0] || { A: "" }).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...rows.map((r) => String((r as any)[key] ?? "").length)
        ) + 2,
    }));
    (worksheet["!cols"] as any) = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tashkilotlar");
    XLSX.writeFile(workbook, "tashkilotlar_holatlari.xlsx");
  };

  const exportMonitoringTableToExcel = () => {
    const rows = monitoringTableData.map((m) => ({
      Tashkilot: m.organization,
      Jami: m.total,
      Yangilangan: m.updated,
      Kutilmoqda: m.pending,
      "Muddati o'tgan": m.overdue,
      "Muddati o'tib yangilangan": m.updatedAfterDeadline,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const colWidths = Object.keys(rows[0] || { A: "" }).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...rows.map((r) => String((r as any)[key] ?? "").length)
        ) + 2,
    }));
    (worksheet["!cols"] as any) = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monitoring");
    XLSX.writeFile(workbook, "monitoring_jadvali.xlsx");
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--primary)]" />
            <p className="text-[var(--muted-foreground)]">
              Ma'lumotlar yuklanmoqda...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-[var(--foreground)] font-semibold mb-2">
              Xatolik yuz berdi
            </p>
            <p className="text-[var(--muted-foreground)]">
              Ma'lumotlarni yuklashda xatolik yuz berdi
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Monitoring
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Monitoring va hisobotlar tizimi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Yangilash
          </Button>
        </div>
      </div>

      {/* Charts Section */}

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-0 rounded-2xl overflow-hidden relative group">
          {/* Glass Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-green-500/10 to-green-600/5 backdrop-blur-sm"></div>
          {/* Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 via-green-500/20 to-green-600/10 rounded-2xl p-[1px]">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl h-full w-full"></div>
          </div>
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-800">
                O'z vaqtida yangilangan
              </h3>
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl backdrop-blur-sm border border-green-200/50">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700 mb-3">
              {statusData.onTime}%
            </div>
            <div className="w-full bg-green-100/50 rounded-full h-2.5 backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-700 shadow-lg"
                style={{ width: `${statusData.onTime}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-green-600 font-medium">
              Yaxshi ishlash ko'rsatkichi
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 rounded-2xl overflow-hidden relative group">
          {/* Glass Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-yellow-500/10 to-yellow-600/5 backdrop-blur-sm"></div>
          {/* Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-yellow-500/20 to-yellow-600/10 rounded-2xl p-[1px]">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl h-full w-full"></div>
          </div>
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-yellow-800">
                Kechiktirilgan
              </h3>
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl backdrop-blur-sm border border-yellow-200/50">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-700 mb-3">
              {statusData.delayed}%
            </div>
            <div className="w-full bg-yellow-100/50 rounded-full h-2.5 backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2.5 rounded-full transition-all duration-700 shadow-lg"
                style={{ width: `${statusData.delayed}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-yellow-600 font-medium">
              E'tibor berish kerak
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 rounded-2xl overflow-hidden relative group">
          {/* Glass Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 via-red-500/10 to-red-600/5 backdrop-blur-sm"></div>
          {/* Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 via-red-500/20 to-red-600/10 rounded-2xl p-[1px]">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl h-full w-full"></div>
          </div>
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-800">Ma'lumot yo'q</h3>
              <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-xl backdrop-blur-sm border border-red-200/50">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-700 mb-3">
              {statusData.noData}%
            </div>
            <div className="w-full bg-red-100/50 rounded-full h-2.5 backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-red-400 to-red-600 h-2.5 rounded-full transition-all duration-700 shadow-lg"
                style={{ width: `${statusData.noData}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-red-600 font-medium">
              Darhol hal qilish kerak
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Status Overview */}
        <Card className="p-6 border-[var(--border)] rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-[var(--primary)]" />
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Umumiy holat taqsimoti
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Line Chart - Monthly Trends */}
        <Card className="p-6 border-[var(--border)] rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-[var(--primary)]" />
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Oylik tendentsiyalar
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="updated"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Yangilangan"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Kutilmoqda"
                />
                <Line
                  type="monotone"
                  dataKey="overdue"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Muddati o'tgan"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bar Chart - Organization Performance */}
      <Card className="p-6 border-[var(--border)] rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
          <h3 className="text-xl font-semibold text-[var(--foreground)]">
            Tashkilotlar ishlash ko'rsatkichlari
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Bajarilgan" />
              <Bar dataKey="total" fill="#3b82f6" name="Jami" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Organizations by Status */}
      <Card className="border-[var(--border)] rounded-xl">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Tashkilotlar kesimida
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportOrganizationsStatusToExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-white"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-2 rounded-lg ${getStatusColor(org.status)}`}
                  >
                    {getStatusIcon(org.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--foreground)] truncate">
                      {org.name}
                    </h4>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {getStatusLabel(org.status)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-[var(--foreground)]">
                      {org.completed}/{org.total}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Bajarilgan
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-[var(--primary)]">
                      {org.percentage}%
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Ulushi
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[var(--primary)] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${org.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Monitoring Table */}
      <Card className="border-[var(--border)] rounded-xl">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Monitoring
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportMonitoringTableToExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]/50">
              <tr>
                <th className="text-left text-lg text-primary p-4 font-semibold uppercase">
                  Tashkilot nomi
                </th>
                <th className="text-center text-lg text-primary p-4 font-semibold">
                  Jami
                </th>
                <th className="text-center text-lg text-primary p-4 font-semibold">
                  Yangilangan
                </th>
                <th className="text-center text-lg text-primary p-4 font-semibold">
                  Kutilmoqda
                </th>
                <th className="text-center text-lg text-primary p-4 font-semibold">
                  Muddati o'tgan
                </th>
                <th className="text-center text-lg text-primary p-4 font-semibold">
                  Muddati o'tib yangilangan
                </th>
                <th className="text-center text-lg text-primary p-4 font-semibold">
                  Amal
                </th>
              </tr>
            </thead>
            <tbody>
              {orgRows.map((org: any, index: number) => (
                <tr
                  key={org.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors"
                >
                  <td className="p-4 font-medium text-[var(--foreground)] text-[14px]">
                    {org.name}
                  </td>
                  <td className="text-center p-4">
                    <Badge
                      variant="secondary"
                      className="bg-[var(--primary)]/10 text-[var(--primary)]"
                    >
                      {org.total_count}
                    </Badge>
                  </td>
                  <td className="text-center p-4">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {org.on_time_count}
                    </Badge>
                  </td>
                  <td className="text-center p-4">
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      {org.total_count -
                        org.on_time_count -
                        org.late_count -
                        org.missed_count}
                    </Badge>
                  </td>
                  <td className="text-center p-4">
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-800"
                    >
                      {org.missed_count}
                    </Badge>
                  </td>
                  <td className="text-center p-4">
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800"
                    >
                      {org.late_count}
                    </Badge>
                  </td>
                  <td className="text-center p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrgId(org.id);
                        setSelectedOrgName(org.name);
                        setNearDeadlineOpen(true);
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Yaqin muddatlar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Near Deadline Modal */}
      <Dialog
        open={nearDeadlineOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNearDeadlineOpen(false);
            setSelectedOrgId("");
            setSelectedOrgName("");
          } else {
            setNearDeadlineOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">
              {selectedOrgName || "Tashkilot"}: yaqin muddatli byulletenlar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {nearLoading ? (
              <div className="p-6 text-center text-[var(--muted-foreground)]">
                Ma'lumotlar yuklanmoqda...
              </div>
            ) : nearDeadlineJournals.length === 0 ? (
              <div className="p-6 text-center text-[var(--muted-foreground)]">
                Yaqin muddatli byulletenlar topilmadi
              </div>
            ) : (
              <div className="space-y-2">
                {nearDeadlineJournals.map((j: any) => (
                  <div
                    key={j.id}
                    className="p-3 border border-[var(--border)] rounded-lg bg-white flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-[var(--foreground)] truncate">
                          {j.name}
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            j.type_of_journal === "bulleten"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {j.type_of_journal === "bulleten"
                            ? "Byulleten"
                            : "Jurnal"}
                        </Badge>
                      </div>
                      {Array.isArray(j.employees_list) &&
                        j.employees_list.length > 0 && (
                          <div className="mt-1 text-xs text-[var(--muted-foreground)] truncate">
                            Mas'ullar:{" "}
                            {j.employees_list
                              .map((e: any) => `${e.first_name} ${e.last_name}`)
                              .join(", ")}
                          </div>
                        )}
                    </div>
                    <div className="ml-4">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-800"
                      >
                        {Array.isArray(j.employees_list)
                          ? j.employees_list.length
                          : 0}{" "}
                        ta mas'ul
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
