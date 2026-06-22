"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  PackageIcon,
  PlusIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@tech-assure/backend/convex/_generated/api";

import { BrandMark } from "./brand-mark";
import { ModeToggle } from "./mode-toggle";
import { DashboardPreview } from "./landing/dashboard-preview";
import { LiveDataBand } from "./landing/live-data-band";
import { BarColumn, DonutRing, SparklinePath } from "./landing/visuals";

const capabilities = [
  {
    title: "Stock and sales in one place.",
    body:
      "Every ring-up at the counter decrements on-hand and updates the dashboard in real time. No spreadsheet reconciliation at end of day.",
    visual: (
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-end justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>On hand vs reorder</span>
          <span>12 SKUs</span>
        </div>
        <div className="h-24">
          <BarColumn
            values={[62, 41, 28, 55, 35, 18, 47, 33, 24, 39, 51, 22]}
            width={400}
            height={96}
            fill="var(--accent-warm)"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    ),
  },
  {
    title: "Stock-outs caught early.",
    body:
      "Demand model retrains on every sale. When weekly demand outpaces cover, an alert lands in the operator queue with the SKU, the supplier, and a recommended order.",
    visual: (
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-end justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Predicted vs actual</span>
          <span>92.1% accuracy</span>
        </div>
        <div className="h-24">
          <SparklinePath
            values={[18, 22, 21, 25, 24, 28, 26, 30, 32, 31, 34, 36]}
            width={400}
            height={96}
            stroke="var(--foreground)"
            strokeWidth={1.2}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className="flex items-center gap-4">
          <DonutRing value={0.921} size={56} stroke={5} label="92%" />
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="text-muted-foreground">MAPE</div>
            <div className="font-mono tabular-nums text-foreground">7.9%</div>
          </div>
        </div>
      </div>
    ),
  },
];

type LandingShellProps = {
  authEnabled: boolean;
};

export default function LandingShell({ authEnabled }: LandingShellProps) {
  const dashboardRoute = "/dashboard" as Route;
  const marketing = useQuery(api.dashboard.marketingSnapshot, {});

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
          <Link href={"/" as Route} className="flex items-center gap-2">
            <BrandMark size={22} className="h-[22px] w-[22px]" />
            <span className="text-[15px] font-semibold tracking-tight">TechAssure</span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {authEnabled ? (
              <Link
                href={"/sign-in" as Route}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
              >
                Open the workspace
                <ArrowRightIcon className="size-3.5" />
              </Link>
            ) : (
              <Link
                href={dashboardRoute}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
              >
                Open the workspace
                <ArrowRightIcon className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="flex flex-col gap-6 animate-fade-up">
              <h1 className="text-[clamp(2.25rem,5.5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
                The TechAssure floor,
                <br />
                in one workspace.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Stock, sales, suppliers and forecasts across all our stores.
                Ring up at the counter, the dashboard re-scores in real time.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {authEnabled ? (
                  <Link
                    href={"/sign-in" as Route}
                    className="group inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-all hover:bg-foreground/85"
                  >
                    Open the workspace
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <Link
                    href={dashboardRoute}
                    className="group inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-all hover:bg-foreground/85"
                  >
                    Open the workspace
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-[color:var(--accent-warm)]" />
                  Live across our stores
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-[color:var(--accent-warm)]" />
                  Operator-scoped access
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-[color:var(--accent-warm)]" />
                  Internal team only
                </div>
              </div>
            </div>

            <div className="relative animate-fade-up delay-2">
              <div
                aria-hidden
                className="absolute -inset-12 -z-10 rounded-full opacity-50 blur-3xl"
                style={{ background: "var(--accent-warm)" }}
              />
              <DashboardPreview className="rotate-[0.6deg]" />
            </div>
          </div>
        </section>

        <LiveDataBand
          monthlyRevenue={marketing?.monthlyRevenue ?? null}
          atRiskSkus={marketing?.atRiskSkus ?? null}
          forecastAccuracy={marketing?.forecastAccuracy ?? null}
          criticalAlerts={marketing?.criticalAlertCount ?? null}
          fastestSupplier={marketing?.fastestSupplierName ?? null}
          topRevenueSku={marketing?.topRevenueSkuName ?? null}
        />

        <section id="capabilities" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-2">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-muted/40 sm:p-8"
              >
                <h3 className="text-lg font-semibold leading-tight tracking-tight">
                  {cap.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{cap.body}</p>
                <div className="mt-2 rounded-lg border border-border bg-card/60 p-4">
                  {cap.visual}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-semibold leading-tight tracking-tight">
                Sign in to the workspace.
              </h2>
              <p className="text-sm text-muted-foreground">
                TechAssure operators only. Ask the operations lead if you need an account.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={"/sign-in" as Route}
                className="group inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-all hover:bg-foreground/85"
              >
                Sign in
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:px-8">
            <div className="flex items-center gap-2">
              <PackageIcon className="size-3" />
              © TechAssure · Live data via Convex
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
              <PlusIcon className="size-3" />
              Build 2026.06
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
