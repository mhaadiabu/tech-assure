import { redirect } from "next/navigation";

import DashboardRuntime from "@/components/dashboard-runtime";
import { clerkEnabledServer, getDashboardViewer } from "@/lib/dashboard-auth";

export default async function DashboardPage() {
  const viewer = await getDashboardViewer();

  if (clerkEnabledServer && !viewer.isAuthenticated) {
    redirect("/");
  }

  return <DashboardRuntime initialViewer={viewer} />;
}
