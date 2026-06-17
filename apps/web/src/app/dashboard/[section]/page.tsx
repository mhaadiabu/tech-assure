import { notFound, redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import { dashboardSectionsByRole, type DashboardSection } from "@/lib/techassure-demo-data";
import { getDashboardViewer } from "@/lib/dashboard-auth";

const KNOWN_SECTIONS = new Set<string>([
  "overview",
  "sales",
  "inventory",
  "suppliers",
  "forecast",
]);

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!KNOWN_SECTIONS.has(section)) {
    notFound();
  }

  const viewer = await getDashboardViewer();
  const availableSections = dashboardSectionsByRole[viewer.role];

  if (!availableSections.includes(section as DashboardSection)) {
    redirect("/dashboard/overview");
  }

  return <DashboardShell activeSection={section as DashboardSection} viewer={viewer} />;
}
