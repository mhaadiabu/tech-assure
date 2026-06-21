"use client";

import type { Route } from "next";
import Link from "next/link";

import { useUser } from "@clerk/nextjs";
import { api } from "@_scaffold/backend/convex/_generated/api";
import type { Doc } from "@_scaffold/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BellRingIcon,
  BrainCircuitIcon,
  CircleAlertIcon,
  GaugeIcon,
  Loader2Icon,
  PackageSearchIcon,
  RefreshCcwIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@_scaffold/ui/components/badge";
import { Button } from "@_scaffold/ui/components/button";
import { Skeleton } from "@_scaffold/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@_scaffold/ui/components/table";

import AppSidebar from "./app-sidebar";
import { SidebarProvider } from "@_scaffold/ui/components/sidebar";
import PosPanel from "./pos-panel";
import {
  dashboardSectionDescriptions,
  dashboardSectionLabels,
  dashboardSectionsByRole,
  type DashboardSection,
  type DashboardSnapshot,
} from "@/lib/techassure-demo-data";
import type { DashboardViewer } from "@/lib/dashboard-auth";

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const chartGrid = "var(--border)";
const chartAxis = "var(--muted-foreground)";

const overviewChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} as const;

const categoryChartConfig = {
  devices: { label: "Devices", color: "var(--chart-1)" },
  accessories: { label: "Accessories", color: "var(--chart-2)" },
  services: { label: "Services", color: "var(--chart-3)" },
} as const;

const inventoryChartConfig = {
  onHand: { label: "On hand", color: "var(--chart-1)" },
  reorderPoint: { label: "Reorder point", color: "var(--chart-3)" },
} as const;

const forecastChartConfig = {
  actual: { label: "Actual", color: "var(--chart-2)" },
  forecast: { label: "Forecast", color: "var(--chart-1)" },
} as const;

function formatDelta(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)}%`;
}

function statusBadgeVariant(status: "healthy" | "watch" | "critical") {
  if (status === "critical") return "destructive" as const;
  if (status === "watch") return "outline" as const;
  return "secondary" as const;
}

function severityVariant(severity: "critical" | "watch" | "info") {
  if (severity === "critical") return "destructive" as const;
  if (severity === "watch") return "outline" as const;
  return "secondary" as const;
}

function MetricGrid({
  items,
}: {
  items: ReadonlyArray<{
    label: string;
    value: string;
    delta: string;
    icon: typeof ActivityIcon;
  }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-2 bg-background px-5 py-4"
        >
          <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <item.icon className="size-3" />
            {item.label}
          </dt>
          <dd className="font-semibold tabular-nums text-2xl text-foreground tracking-tight">
            {item.value}
          </dd>
          <dd className="text-xs tabular-nums text-muted-foreground">{item.delta}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card " +
        (className ?? "")
      }
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function OverviewPanel({
  snapshot,
  managementPanel,
}: {
  snapshot: DashboardSnapshot;
  managementPanel?: React.ReactNode;
}) {
  const { dashboardSummary, salesPerformance, inventoryHealth, recommendations, alertFeed } = snapshot;

  return (
    <div className="flex flex-col gap-6">
      <MetricGrid
        items={[
          {
            label: "Monthly revenue",
            value: currency.format(dashboardSummary.monthlyRevenue),
            delta: formatDelta(dashboardSummary.monthlyRevenueChange),
            icon: TrendingUpIcon,
          },
          {
            label: "Gross margin",
            value: percent.format(dashboardSummary.grossMargin),
            delta: formatDelta(dashboardSummary.grossMarginChange),
            icon: GaugeIcon,
          },
          {
            label: "Sell-through",
            value: percent.format(dashboardSummary.sellThroughRate),
            delta: formatDelta(dashboardSummary.sellThroughRateChange),
            icon: ShoppingCartIcon,
          },
          {
            label: "Forecast accuracy",
            value: percent.format(dashboardSummary.forecastAccuracy),
            delta: formatDelta(dashboardSummary.forecastAccuracyChange),
            icon: BrainCircuitIcon,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Commercial pulse" description="Last 6 months of revenue and order volume">
          <div className="h-[320px] min-w-0 px-2 py-4">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={[...salesPerformance]} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-orders)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--color-orders)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="month"
                  tickLine={false}
                  tickMargin={8}
                  stroke={chartAxis}
                  fontSize={11}
                />
                <YAxis
                  axisLine={false}
                  tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                  tickLine={false}
                  width={42}
                  stroke={chartAxis}
                  fontSize={11}
                />
                <Area
                  dataKey="revenue"
                  fill="url(#revFill)"
                  stroke="var(--color-revenue)"
                  strokeWidth={1.5}
                  type="monotone"
                />
                <Area
                  dataKey="orders"
                  fill="url(#ordFill)"
                  stroke="var(--color-orders)"
                  strokeWidth={1.5}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recommendations" description="Suggested actions to improve operations">
          <ul className="divide-y divide-border">
            {recommendations.map((item) => (
              <li key={item.title} className="flex flex-col gap-1.5 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {item.impact}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Demand watchlist" description="Products at the highest replenishment risk">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Cover</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryHealth.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.coverageWeeks.toFixed(1)}w
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.supplier}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <div className="flex flex-col gap-6">
          {alertFeed.slice(0, 2).map((alert) => (
            <Panel
              key={alert.title}
              title={alert.title}
              description={alert.severity === "critical" ? "Critical alert" : "Watch alert"}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <p className="text-sm leading-relaxed text-foreground">{alert.detail}</p>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      </div>

      {managementPanel}
    </div>
  );
}

function SalesPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { salesPerformance, topProducts } = snapshot;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Panel title="Revenue mix" description="Monthly revenue by category">
        <div className="h-[340px] min-w-0 px-2 py-4">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={[...salesPerformance]} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="month"
                tickLine={false}
                tickMargin={8}
                stroke={chartAxis}
                fontSize={11}
              />
              <YAxis
                axisLine={false}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                tickLine={false}
                width={42}
                stroke={chartAxis}
                fontSize={11}
              />
              <Bar dataKey="devices" fill="var(--color-devices)" radius={2} stackId="mix" />
              <Bar dataKey="accessories" fill="var(--color-accessories)" radius={2} stackId="mix" />
              <Bar dataKey="services" fill="var(--color-services)" radius={2} stackId="mix" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Top products" description="Highest revenue contributors">
        <ul className="divide-y divide-border">
          {topProducts.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {item.units} units · {item.margin.toFixed(1)}% margin
                </div>
              </div>
              <div className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {currency.format(item.revenue)}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function InventoryPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { inventoryHealth } = snapshot;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <Panel title="Inventory pressure" description="On-hand vs reorder point by SKU">
        <div className="h-[340px] min-w-0 px-2 py-4">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={[...inventoryHealth]} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="sku"
                tickLine={false}
                tickMargin={8}
                stroke={chartAxis}
                fontSize={10}
                interval={0}
                angle={-30}
                dy={6}
                height={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={32}
                stroke={chartAxis}
                fontSize={11}
              />
              <Bar dataKey="onHand" fill="var(--color-onHand)" radius={2} />
              <Bar dataKey="reorderPoint" fill="var(--color-reorderPoint)" radius={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Restock queue" description="Sorted by lowest weeks-of-cover">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Cover</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryHealth.map((item) => (
              <TableRow key={item.sku}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.supplier} · {item.nextDelivery}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.coverageWeeks.toFixed(1)}w
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.onHand}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

function SuppliersPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { supplierSnapshots } = snapshot;

  return (
    <Panel title="Supplier network" description="Reliability, lead time, and fill rate across vendors">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Reliability</TableHead>
            <TableHead className="text-right">Lead time</TableHead>
            <TableHead className="text-right">Fill rate</TableHead>
            <TableHead className="text-right">Open orders</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {supplierSnapshots.map((supplier) => (
            <TableRow key={supplier.name}>
              <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                <span
                  className={
                    supplier.reliability < 80
                      ? "text-destructive"
                      : "text-foreground"
                  }
                >
                  {supplier.reliability}%
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{supplier.leadDays}d</TableCell>
              <TableCell className="text-right tabular-nums">{supplier.fillRate}%</TableCell>
              <TableCell className="text-right tabular-nums">{supplier.openOrders}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{supplier.note || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function ForecastPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { demandForecast, alertFeed } = snapshot;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Panel title="Demand forecast" description="Predicted vs actual weekly units">
        <div className="h-[340px] min-w-0 px-2 py-4">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={[...demandForecast]} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={chartGrid} vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="week"
                tickLine={false}
                tickMargin={8}
                stroke={chartAxis}
                fontSize={11}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={32}
                stroke={chartAxis}
                fontSize={11}
              />
              <Line
                dataKey="actual"
                dot={false}
                stroke="var(--color-actual)"
                strokeWidth={1.5}
                type="monotone"
              />
              <Line
                dataKey="forecast"
                dot={false}
                stroke="var(--color-forecast)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Forecast alerts" description="Items flagged by predictive analysis">
        <ul className="divide-y divide-border">
          {alertFeed.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">No active alerts.</li>
          ) : (
            alertFeed.map((alert) => (
              <li key={alert.title} className="flex flex-col gap-1.5 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{alert.title}</span>
                  <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{alert.detail}</p>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 bg-background px-5 py-4">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[360px] rounded-lg" />
        <Skeleton className="h-[360px] rounded-lg" />
      </div>
    </div>
  );
}

function DashboardAuthRequiredState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-8 py-12 text-center">
      <CircleAlertIcon className="size-6 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Sign in to view the command deck</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The TechAssure operational dashboard needs an authenticated operator to load live sales,
        inventory, supplier, and forecast data from Convex.
      </p>
      <div className="flex gap-2 pt-2">
        <Link
          href={"/sign-in" as Route}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Sign in
        </Link>
        <Link
          href={"/" as Route}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}

function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-8 py-12 text-center">
      <CircleAlertIcon className="size-6 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Live data could not be loaded</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        We could not reach the TechAssure Convex deployment. Check the deployment URL and Clerk
        JWT issuer configuration, then retry.
      </p>
      <div className="flex gap-2 pt-2">
        <Button onClick={onRetry}>Retry</Button>
        <Link
          href={"/" as Route}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}

function DashboardEmptyState({
  onSeed,
  seeding,
}: {
  onSeed: () => void;
  seeding: boolean;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card px-8 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
        <PackageSearchIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-foreground">Workspace is empty</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          No products, suppliers or sales yet. Seed demo data to explore the dashboard.
          The seed only runs once; the dashboard rebuilds its forecasts from then on.
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <Button disabled={seeding} onClick={onSeed}>
          {seeding ? (
            <Loader2Icon className="size-3.5 animate-spin" data-icon="inline-start" />
          ) : (
            <SparklesIcon className="size-3.5" data-icon="inline-start" />
          )}
          {seeding ? "Loading demo data…" : "Seed demo data"}
        </Button>
      </div>
    </div>
  );
}

type UserRow = {
  _id: Doc<"users">["_id"];
  name: string;
  email: string | null;
  role: DashboardViewer["role"];
  companyName: string;
};

function RoleManagementPanel({
  users,
  onUpdateRole,
  pendingUserId,
}: {
  users: readonly UserRow[] | undefined;
  onUpdateRole: (userId: Doc<"users">["_id"], role: DashboardViewer["role"]) => void;
  pendingUserId: Doc<"users">["_id"] | null;
}) {
  return (
    <Panel
      title="Operator roles"
      description="Manage which capabilities each team member can access"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operator</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="text-right">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!users ? (
            <TableRow>
              <TableCell colSpan={3}>
                <div className="flex flex-col gap-2 py-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                No authenticated operators synced yet.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.companyName}</TableCell>
                <TableCell className="text-right">
                  <select
                    aria-label={`Change role for ${user.name}`}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground"
                    disabled={pendingUserId === user._id}
                    onChange={(event) => onUpdateRole(user._id, event.target.value as DashboardViewer["role"])}
                    value={user.role}
                  >
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="analyst">Analyst</option>
                    <option value="operations">Operations</option>
                  </select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Panel>
  );
}

type DashboardShellProps = {
  activeSection: DashboardSection;
  viewer: DashboardViewer;
};

export default function DashboardShell({ activeSection, viewer }: DashboardShellProps) {
  const availableSections = dashboardSectionsByRole[viewer.role];
  const isLive = viewer.authMode === "clerk" && viewer.isAuthenticated;
  const { user, isLoaded } = useUser();
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const syncViewer = useMutation(api.dashboard.syncViewer);
  const ensureSeedData = useMutation(api.dashboard.ensureSeedData);
  const updateUserRole = useMutation(api.dashboard.updateUserRole);
  const initializedRef = useRef(false);
  const [pendingUserId, setPendingUserId] = useState<Doc<"users">["_id"] | null>(null);
  const canUseConvexAuth = isLive && isLoaded && !isConvexAuthLoading && isConvexAuthenticated;

  const persistedViewer = useQuery(api.dashboard.viewer, canUseConvexAuth ? {} : "skip");
  const snapshot = useQuery(api.dashboard.snapshot, canUseConvexAuth ? {} : "skip");
  const effectiveRole = persistedViewer?.role ?? viewer.role;
  const users = useQuery(
    api.dashboard.listUsers,
    canUseConvexAuth && effectiveRole === "manager" ? {} : "skip"
  );

  useEffect(() => {
    if (!canUseConvexAuth || !user || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    void (async () => {
      try {
        const metadata = user.publicMetadata as Record<string, unknown> | undefined;
        const companyName =
          typeof metadata?.companyName === "string"
            ? metadata.companyName
            : typeof metadata?.organization === "string"
              ? metadata.organization
              : "TechAssure";

        await syncViewer({
          name: user.fullName ?? user.firstName ?? "TechAssure operator",
          email: user.primaryEmailAddress?.emailAddress,
          companyName,
        });
      } catch (error) {
        console.error("[dashboard] bootstrap failed", error);
        toast.error(error instanceof Error ? error.message : "Unable to initialize dashboard");
        initializedRef.current = false;
      }
    })();
  }, [canUseConvexAuth, syncViewer, user]);

  const [seeding, setSeeding] = useState(false);
  const handleSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const result = await ensureSeedData({});
      toast.success(result.seeded ? "Demo data loaded" : "Forecast refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  };

  const effectiveViewer = useMemo<DashboardViewer>(() => {
    if (!persistedViewer) {
      return viewer;
    }

    return {
      authMode: viewer.authMode,
      isAuthenticated: viewer.isAuthenticated,
      name: persistedViewer.name,
      email: persistedViewer.email,
      role: persistedViewer.role,
      companyName: persistedViewer.companyName,
    };
  }, [viewer, persistedViewer]);

  const canSeed = isLive && effectiveViewer.role === "manager";

  const liveSnapshot = isLive ? (snapshot as DashboardSnapshot | undefined) : undefined;
  const isInitialLoading = isLive && !canUseConvexAuth;
  const criticalAlerts = liveSnapshot
    ? liveSnapshot.alertFeed.filter((item) => item.severity === "critical").length
    : 0;
  const showSkeleton = isLive && (liveSnapshot === undefined || liveSnapshot === null);
  const displaySnapshot: DashboardSnapshot | undefined = liveSnapshot;

  const managementPanel =
    isLive && effectiveViewer.role === "manager" ? (
      <RoleManagementPanel
        pendingUserId={pendingUserId}
        users={users}
        onUpdateRole={(userId, role) => {
          setPendingUserId(userId);
          void updateUserRole({ userId, role })
            .then(() => toast.success("Role updated"))
            .catch((error) =>
              toast.error(error instanceof Error ? error.message : "Unable to update role")
            )
            .finally(() => setPendingUserId(null));
        }}
      />
    ) : undefined;

  const content = (() => {
    if (isInitialLoading || showSkeleton) {
      return <DashboardSkeleton />;
    }

    if (!displaySnapshot) {
      return isLive ? (
        <DashboardErrorState
          onRetry={() => {
            window.location.reload();
          }}
        />
      ) : (
        <DashboardAuthRequiredState />
      );
    }

    const workspaceIsEmpty =
      isLive &&
      displaySnapshot.salesPerformance.length === 0 &&
      displaySnapshot.inventoryHealth.length === 0 &&
      displaySnapshot.supplierSnapshots.length === 0;

    if (workspaceIsEmpty) {
      return <DashboardEmptyState onSeed={handleSeed} seeding={seeding} />;
    }

    if (activeSection === "pos") {
      return (
        <PosPanel
          authEnabled={effectiveViewer.authMode === "clerk"}
          isAuthenticated={isLive}
          convexReady={canUseConvexAuth}
          canReceiveStock={
            effectiveViewer.role === "manager" || effectiveViewer.role === "operations"
          }
        />
      );
    }

    switch (activeSection) {
      case "sales":
        return <SalesPanel snapshot={displaySnapshot} />;
      case "inventory":
        return <InventoryPanel snapshot={displaySnapshot} />;
      case "suppliers":
        return <SuppliersPanel snapshot={displaySnapshot} />;
      case "forecast":
        return <ForecastPanel snapshot={displaySnapshot} />;
      default:
        return <OverviewPanel managementPanel={managementPanel} snapshot={displaySnapshot} />;
    }
  })();

  const linkButtonClass =
    "inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
  const linkButtonPrimaryClass =
    "inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const [seedConfirmArmed, setSeedConfirmArmed] = useState(false);
  useEffect(() => {
    if (!seedConfirmArmed) return;
    const id = setTimeout(() => setSeedConfirmArmed(false), 4000);
    return () => clearTimeout(id);
  }, [seedConfirmArmed]);

  const headerAction = (() => {
    if (activeSection === "pos") {
      return null;
    }
    if (availableSections.includes("inventory") && activeSection !== "inventory") {
      return (
        <Link href={"/dashboard/inventory" as Route} className={linkButtonClass}>
          <PackageSearchIcon className="size-3.5" />
          Reorder queue
        </Link>
      );
    }
    if (availableSections.includes("pos")) {
      return (
        <Link href={"/dashboard/pos" as Route} className={linkButtonPrimaryClass}>
          <ShoppingCartIcon className="size-3.5" />
          Open POS
          <ArrowRightIcon className="size-3.5" />
        </Link>
      );
    }
    if (availableSections.includes("forecast") && activeSection !== "forecast") {
      return (
        <Link href={"/dashboard/forecast" as Route} className={linkButtonClass}>
          <BrainCircuitIcon className="size-3.5" />
          Forecast
        </Link>
      );
    }
    return null;
  })();

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        activeSection={activeSection}
        availableSections={availableSections}
        viewer={effectiveViewer}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                {dashboardSectionLabels[activeSection]}
              </h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {dashboardSectionDescriptions[activeSection]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isLive ? (
              <Badge variant="outline" className="hidden gap-1.5 sm:flex">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {liveSnapshot?.dashboardSummary.liveSyncStatus ?? "Connecting"}
              </Badge>
            ) : null}
            {criticalAlerts > 0 ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangleIcon className="size-3" />
                {criticalAlerts}
              </Badge>
            ) : null}
            {canSeed && activeSection !== "pos" ? (
              <button
                aria-label={seedConfirmArmed ? "Confirm seed demo data" : "Seed demo data"}
                className={
                  "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors " +
                  (seedConfirmArmed
                    ? "border-[color:var(--accent-warm)] bg-[color:var(--accent-warm)]/15 text-[color:var(--accent-warm-foreground)]"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")
                }
                disabled={seeding}
                onClick={() => {
                  if (!seedConfirmArmed) {
                    setSeedConfirmArmed(true);
                    return;
                  }
                  setSeedConfirmArmed(false);
                  void handleSeed();
                }}
                type="button"
              >
                {seeding ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <SparklesIcon className="size-3" />
                )}
                {seeding ? "Seeding…" : seedConfirmArmed ? "Click to confirm" : "Seed data"}
              </button>
            ) : null}
            {headerAction}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-8">{content}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
