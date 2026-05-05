import type { Route } from "next";
import { redirect } from "next/navigation";

import LandingShell from "@/components/landing-shell";
import { clerkEnabledServer, getDashboardViewer } from "@/lib/dashboard-auth";

export default async function Home() {
  const viewer = await getDashboardViewer();

  if (clerkEnabledServer && viewer.isAuthenticated) {
    redirect("/dashboard" as Route);
  }

  return <LandingShell authEnabled={clerkEnabledServer} />;
}
