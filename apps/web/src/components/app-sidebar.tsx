"use client";

import { UserButton } from "@clerk/nextjs";
import {
  ActivityIcon,
  BinaryIcon,
  BoxesIcon,
  BrainCircuitIcon,
  Building2Icon,
  ChartColumnBigIcon,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@_scaffold/ui/components/sidebar";

import { ModeToggle } from "./mode-toggle";
import type { DashboardViewer } from "@/lib/dashboard-auth";
import type { DashboardSection } from "@/lib/techassure-demo-data";

const navigation = [
  { id: "overview", label: "Overview", icon: ActivityIcon },
  { id: "sales", label: "Sales pulse", icon: ChartColumnBigIcon },
  { id: "inventory", label: "Inventory", icon: BoxesIcon },
  { id: "suppliers", label: "Suppliers", icon: Building2Icon },
  { id: "forecast", label: "Forecasts", icon: BrainCircuitIcon },
] as const satisfies ReadonlyArray<{
  id: DashboardSection;
  label: string;
  icon: typeof ActivityIcon;
}>;

type AppSidebarProps = {
  activeSection: DashboardSection;
  availableSections: readonly DashboardSection[];
  criticalAlerts: number;
  viewer: DashboardViewer;
};

export default function AppSidebar({
  activeSection,
  availableSections,
  criticalAlerts,
  viewer,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isLive = viewer.authMode === "clerk" && viewer.isAuthenticated;
  const visibleNavigation = navigation.filter((item) => availableSections.includes(item.id));

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="overflow-hidden px-2 py-3">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center">
            <BinaryIcon className="size-4 shrink-0 text-sidebar-foreground" />
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-1">
            <BinaryIcon className="size-4 shrink-0 text-sidebar-foreground/60" />
            <span className="font-display text-lg leading-none text-sidebar-foreground">
              TechAssure
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavigation.map((item) => {
                const active = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={`/dashboard/${item.id}`} />}
                      tooltip={item.label}
                      className={active ? "" : "opacity-40 hover:opacity-100"}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.id === "forecast" && criticalAlerts > 0 ? (
                      <SidebarMenuBadge>{criticalAlerts}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="overflow-hidden px-2 py-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {isLive ? <UserButton /> : null}
            <ModeToggle />
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-between gap-2 pl-1">
            {isLive ? (
              <div className="flex min-w-0 items-center gap-2">
                <UserButton />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium text-sidebar-foreground">
                    {viewer.name}
                  </span>
                  {viewer.email ? (
                    <span className="truncate text-[11px] text-sidebar-foreground/40">
                      {viewer.email}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <span className="text-xs text-sidebar-foreground/40">Demo mode</span>
            )}
            <ModeToggle />
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
