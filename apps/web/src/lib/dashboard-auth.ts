import { auth, currentUser } from "@clerk/nextjs/server";

import type { DashboardRole } from "./techassure-demo-data";

export type DashboardViewer = {
  authMode: "clerk" | "demo";
  isAuthenticated: boolean;
  name: string;
  email: string | null;
  role: DashboardRole;
  companyName: string;
};

export const clerkEnabledServer = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

function isDashboardRole(value: unknown): value is DashboardRole {
  return value === "manager" || value === "analyst" || value === "operations";
}

function inferRoleFromEmail(email: string | null): DashboardRole {
  const normalized = email?.toLowerCase() ?? "";

  if (
    normalized.includes("ops") ||
    normalized.includes("operations") ||
    normalized.includes("warehouse") ||
    normalized.includes("inventory")
  ) {
    return "operations";
  }

  if (
    normalized.includes("analyst") ||
    normalized.includes("insight") ||
    normalized.includes("finance") ||
    normalized.includes("data")
  ) {
    return "analyst";
  }

  return "manager";
}

function readRoleFromMetadata(metadata: Record<string, unknown> | undefined, email: string | null) {
  const rawRole = metadata?.dashboardRole ?? metadata?.techAssureRole ?? metadata?.role;
  return isDashboardRole(rawRole) ? rawRole : inferRoleFromEmail(email);
}

function readCompanyFromMetadata(metadata: Record<string, unknown> | undefined) {
  const companyName = metadata?.companyName ?? metadata?.organization ?? metadata?.company;
  return typeof companyName === "string" && companyName.length > 0 ? companyName : "TechAssure";
}

export async function getDashboardViewer(): Promise<DashboardViewer> {
  if (!clerkEnabledServer) {
    return {
      authMode: "demo",
      isAuthenticated: false,
      name: "Demo operator",
      email: null,
      role: "manager",
      companyName: "TechAssure",
    };
  }

  const { userId } = await auth();

  if (!userId) {
    return {
      authMode: "clerk",
      isAuthenticated: false,
      name: "Guest",
      email: null,
      role: "manager",
      companyName: "TechAssure",
    };
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const metadata = user?.publicMetadata as Record<string, unknown> | undefined;

  return {
    authMode: "clerk",
    isAuthenticated: true,
    name: user?.fullName ?? user?.firstName ?? "TechAssure operator",
    email,
    role: readRoleFromMetadata(metadata, email),
    companyName: readCompanyFromMetadata(metadata),
  };
}
