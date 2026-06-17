import { redirect } from "next/navigation";

import { getDashboardViewer } from "@/lib/dashboard-auth";
import { dashboardSectionsByRole } from "@/lib/techassure-demo-data";

export default async function DashboardIndex() {
  const viewer = await getDashboardViewer();
  const defaultSection = dashboardSectionsByRole[viewer.role][0] ?? "overview";
  redirect(`/dashboard/${defaultSection}`);
}
