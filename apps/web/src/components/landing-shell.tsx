"use client";

import {
  ArrowRightIcon,
  BinaryIcon,
  BrainCircuitIcon,
  Building2Icon,
  ChartColumnBigIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@_scaffold/ui/components/badge";
import { Button } from "@_scaffold/ui/components/button";

import { ModeToggle } from "./mode-toggle";
import {
  alertFeed,
  dashboardSummary,
  inventoryHealth,
  supplierSnapshots,
  topProducts,
} from "@/lib/techassure-demo-data";

const featureItems = [
  { label: "Inventory clarity", icon: Building2Icon },
  { label: "Sales intelligence", icon: ChartColumnBigIcon },
  { label: "Predictive guidance", icon: BrainCircuitIcon },
] as const;

type LandingShellProps = {
  authEnabled: boolean;
};

export default function LandingShell({ authEnabled }: LandingShellProps) {
  const dashboardRoute = "/dashboard" as Route;

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center border border-border bg-foreground text-background">
              <BinaryIcon className="size-4" />
            </div>
            <span className="font-display text-2xl leading-none">TechAssure</span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {authEnabled ? (
              <>
                <Link href={"/sign-in" as Route}>
                  <Button variant="outline" size="sm">Sign in</Button>
                </Link>
                <Link href={"/sign-up" as Route}>
                  <Button size="sm">
                    Get access
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={dashboardRoute}>
                <Button size="sm">
                  Open demo
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="techassure-surface relative overflow-hidden">
        <div className="techassure-grid pointer-events-none absolute inset-0 opacity-40" />

        <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <Badge variant="outline" className="w-fit">Retail command system</Badge>
              <h1 className="font-display text-5xl leading-none tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Intelligent operations for TechAssure.
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border/80 bg-card/90 px-4 py-4">
                <div className="text-xs text-muted-foreground">Monthly revenue</div>
                <div className="mt-1 font-display text-3xl leading-none">
                  GHS {dashboardSummary.monthlyRevenue.toLocaleString()}
                </div>
              </div>
              <div className="border border-border/80 bg-card/90 px-4 py-4">
                <div className="text-xs text-muted-foreground">At-risk SKUs</div>
                <div className="mt-1 font-display text-3xl leading-none">
                  {dashboardSummary.atRiskSkus}
                </div>
              </div>
              <div className="border border-border/80 bg-card/90 px-4 py-4">
                <div className="text-xs text-muted-foreground">Forecast accuracy</div>
                <div className="mt-1 font-display text-3xl leading-none">
                  {(dashboardSummary.forecastAccuracy * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {featureItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 border border-border/80 bg-card/88 px-4 py-3"
                >
                  <item.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="border border-border/80 bg-card/94 px-4 py-4">
              <div className="mb-3 text-xs text-muted-foreground">Live operational focus</div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between gap-3 border border-border/70 bg-background/70 px-3 py-2.5">
                  <span className="text-muted-foreground">Critical alerts</span>
                  <span className="font-mono text-foreground">
                    {alertFeed.filter((item) => item.severity === "critical").length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border border-border/70 bg-background/70 px-3 py-2.5">
                  <span className="text-muted-foreground">Fastest supplier</span>
                  <span className="font-medium text-foreground">{supplierSnapshots[2]?.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border border-border/70 bg-background/70 px-3 py-2.5">
                  <span className="text-muted-foreground">Lowest cover</span>
                  <span className="font-medium text-foreground">{inventoryHealth[2]?.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border border-border/70 bg-background/70 px-3 py-2.5">
                  <span className="text-muted-foreground">Top revenue SKU</span>
                  <span className="font-medium text-foreground">{topProducts[0]?.name}</span>
                </div>
              </div>
            </div>

            <div className="border border-border/80 bg-foreground px-4 py-5 text-background">
              <div className="mb-4 font-display text-3xl leading-tight text-background">
                {authEnabled ? "Sign in to your workspace." : "Demo mode is live."}
              </div>
              {authEnabled ? (
                <Link href={"/sign-in" as Route}>
                  <Button variant="secondary" size="sm">Open sign-in</Button>
                </Link>
              ) : (
                <Link href={dashboardRoute}>
                  <Button variant="secondary" size="sm">
                    Open workspace
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
