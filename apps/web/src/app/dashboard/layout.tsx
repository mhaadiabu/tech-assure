import { redirect } from "next/navigation";

import { clerkEnabledServer, getDashboardViewer } from "@/lib/dashboard-auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getDashboardViewer();

  if (clerkEnabledServer && !viewer.isAuthenticated) {
    redirect("/");
  }

  return <>{children}</>;
}
