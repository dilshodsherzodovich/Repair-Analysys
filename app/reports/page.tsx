"use client";

import ReportDashboard from "@/components/reports/report-dashboard";
import { withRole } from "@/components/withRole";

function Reports() {
  return <ReportDashboard />;
}

export default withRole(Reports, ["admin", "dejurniy", "moderator", "tchzr"]);
