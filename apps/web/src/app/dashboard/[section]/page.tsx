import { notFound } from "next/navigation";

import DashboardShell from "@/components/dashboard-shell";
import {
  dashboardSectionDescriptions,
  dashboardSectionLabels,
  dashboardSectionsByRole,
  type DashboardSection,
} from "@/lib/techassure-demo-data";
import { getDashboardViewer } from "@/lib/dashboard-auth";

const KNOWN_SECTIONS = new Set<string>([
  "overview",
  "pos",
  "sales",
  "inventory",
  "suppliers",
  "forecast",
]);

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!KNOWN_SECTIONS.has(section)) {
    return { title: "Not found · TechAssure" };
  }
  const key = section as DashboardSection;
  return {
    title: `${dashboardSectionLabels[key]} · TechAssure`,
    description: dashboardSectionDescriptions[key],
  };
}

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
    notFound();
  }

  return <DashboardShell activeSection={section as DashboardSection} viewer={viewer} />;
}
