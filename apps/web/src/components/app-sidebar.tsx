"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@tech-assure/ui/components/sidebar";

import { ActivityIcon, BoxesIcon, BrainCircuitIcon, Building2Icon, ChartColumnBigIcon, ShoppingCartIcon } from "lucide-react";

import { BrandMark } from "./brand-mark";

import { Avatar } from "./avatar";
import { ModeToggle } from "./mode-toggle";
import type { DashboardViewer } from "@/lib/dashboard-auth";
import type { DashboardSection } from "@/lib/techassure-demo-data";

const navigation = [
  { id: "overview", label: "Overview", icon: ActivityIcon },
  { id: "pos", label: "Point of sale", icon: ShoppingCartIcon },
  { id: "sales", label: "Sales", icon: ChartColumnBigIcon },
  { id: "inventory", label: "Inventory", icon: BoxesIcon },
  { id: "suppliers", label: "Suppliers", icon: Building2Icon },
  { id: "forecast", label: "Forecast", icon: BrainCircuitIcon },
] as const satisfies ReadonlyArray<{
  id: DashboardSection;
  label: string;
  icon: typeof ActivityIcon;
}>;

type AppSidebarProps = {
  activeSection: DashboardSection;
  availableSections: readonly DashboardSection[];
  viewer: DashboardViewer;
};

export default function AppSidebar({
  activeSection,
  availableSections,
  viewer,
}: AppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const [mounted, setMounted] = useState(false);
  const { signOut } = useClerk();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLive = viewer.authMode === "clerk" && viewer.isAuthenticated;
  const showLiveFooter = mounted && isLive;
  const visibleNavigation = navigation.filter((item) => availableSections.includes(item.id));
  const avatarSeed = viewer.email ?? viewer.name ?? "techassure-demo";

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 px-3">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center">
            <BrandMark size={22} className="h-[22px] w-[22px]" />
          </div>
        ) : (
          <div className="flex h-8 items-center gap-2 px-1">
            <BrandMark size={22} className="h-[22px] w-[22px]" />
            <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
              TechAssure
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="gap-0.5">
          {visibleNavigation.map((item) => {
            const active = activeSection === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={active}
                  render={<Link href={`/dashboard/${item.id}`} />}
                  tooltip={item.label}
                  size="sm"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                  className={
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  }
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {showLiveFooter ? (
              <>
                <Avatar
                  seed={avatarSeed}
                  name={viewer.name}
                  email={viewer.email}
                  size={28}
                />
                <button
                  aria-label="Sign out"
                  className="inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    void signOut();
                  }}
                  type="button"
                >
                  <LogOutIcon className="size-3.5" />
                </button>
              </>
            ) : null}
            <ModeToggle />
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-between gap-2">
            {showLiveFooter ? (
              <>
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar
                    seed={avatarSeed}
                    name={viewer.name}
                    email={viewer.email}
                    size={28}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-medium leading-tight text-sidebar-foreground">
                      {viewer.name}
                    </span>
                    {viewer.email ? (
                      <span className="truncate text-[11px] leading-tight text-sidebar-foreground/55">
                        {viewer.email}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  aria-label="Sign out"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    void signOut();
                  }}
                  type="button"
                >
                  <LogOutIcon className="size-3.5" />
                </button>
              </>
            ) : (
              <span className="text-[11px] text-sidebar-foreground/55">Demo mode</span>
            )}
            <ModeToggle />
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
