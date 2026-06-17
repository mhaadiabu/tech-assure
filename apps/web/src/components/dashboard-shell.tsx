"use client";

import Link from "next/link";

import { useUser } from "@clerk/nextjs";
import { api } from "@_scaffold/backend/convex/_generated/api";
import type { Doc } from "@_scaffold/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  ActivityIcon,
  BellRingIcon,
  BrainCircuitIcon,
  CircleAlertIcon,
  Clock3Icon,
  GaugeIcon,
  PackagePlusIcon,
  PackageSearchIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
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
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@_scaffold/ui/components/alert";
import { Badge } from "@_scaffold/ui/components/badge";
import { Button } from "@_scaffold/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@_scaffold/ui/components/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@_scaffold/ui/components/chart";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@_scaffold/ui/components/empty";
import { Input } from "@_scaffold/ui/components/input";
import { Label } from "@_scaffold/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@_scaffold/ui/components/select";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@_scaffold/ui/components/sidebar";
import { Skeleton } from "@_scaffold/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@_scaffold/ui/components/table";
import { cn } from "@_scaffold/ui/lib/utils";

import AppSidebar from "./app-sidebar";
import {
  dashboardSectionLabels,
  dashboardSectionsByRole,
  demoDashboardSnapshot,
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

const overviewChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const categoryChartConfig = {
  devices: {
    label: "Devices",
    color: "var(--chart-2)",
  },
  accessories: {
    label: "Accessories",
    color: "var(--chart-1)",
  },
  services: {
    label: "Services",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const inventoryChartConfig = {
  onHand: {
    label: "On hand",
    color: "var(--chart-2)",
  },
  reorderPoint: {
    label: "Reorder point",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const forecastChartConfig = {
  actual: {
    label: "Actual",
    color: "var(--chart-2)",
  },
  forecast: {
    label: "Forecast",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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

function MetricCard({
  title,
  value,
  delta,
  icon: Icon,
  caption,
}: {
  title: string;
  value: string;
  delta: string;
  caption: string;
  icon: typeof ActivityIcon;
}) {
  return (
    <Card className="border border-border/70 bg-card/85 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Icon />
          {title}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">{delta}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="font-display text-4xl leading-none text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function OverviewPanel({
  snapshot,
  managementPanel,
  operationsPanel,
}: {
  snapshot: DashboardSnapshot;
  managementPanel?: React.ReactNode;
  operationsPanel?: React.ReactNode;
}) {
  const { dashboardSummary, salesPerformance, inventoryHealth, recommendations, alertFeed } = snapshot;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Monthly revenue"
          value={currency.format(dashboardSummary.monthlyRevenue)}
          delta={formatDelta(dashboardSummary.monthlyRevenueChange)}
          caption="Tracked against last month's close."
          icon={TrendingUpIcon}
        />
        <MetricCard
          title="Gross margin"
          value={percent.format(dashboardSummary.grossMargin)}
          delta={formatDelta(dashboardSummary.grossMarginChange)}
          caption="Margin protection after bundle activity."
          icon={GaugeIcon}
        />
        <MetricCard
          title="Sell-through rate"
          value={percent.format(dashboardSummary.sellThroughRate)}
          delta={formatDelta(dashboardSummary.sellThroughRateChange)}
          caption="Fast-moving categories remain healthy."
          icon={ShoppingCartIcon}
        />
        <MetricCard
          title="Forecast accuracy"
          value={percent.format(dashboardSummary.forecastAccuracy)}
          delta={formatDelta(dashboardSummary.forecastAccuracyChange)}
          caption="Model confidence on current reorder window."
          icon={BrainCircuitIcon}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-border/70 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Commercial pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={overviewChartConfig} className="min-h-[320px] w-full">
              <AreaChart data={salesPerformance}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={10} />
                <YAxis
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  tickLine={false}
                  width={46}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: "var(--color-border)" }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  fillOpacity={0.18}
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  type="monotone"
                />
                <Area
                  dataKey="orders"
                  fill="var(--color-orders)"
                  fillOpacity={0.12}
                  stroke="var(--color-orders)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="border border-border/70 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recommendations.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-none border border-border/70 bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{item.title}</div>
                  <Badge variant="secondary">{item.impact}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{item.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border border-border/70 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle>Demand watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Cover</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryHealth.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.coverageWeeks.toFixed(1)} weeks</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          {alertFeed.slice(0, 2).map((alert) => (
            <Alert
              key={alert.title}
              variant={alert.severity === "critical" ? "destructive" : "default"}
              className="border-border/70 bg-card/85 backdrop-blur"
            >
              <CircleAlertIcon />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.detail}</AlertDescription>
              <AlertAction>
                <Button size="xs" variant="outline">
                  Review
                </Button>
              </AlertAction>
            </Alert>
          ))}
        </div>
      </div>
      {operationsPanel || managementPanel ? (
        <div
          className={cn(
            "grid gap-4",
            operationsPanel && managementPanel && "xl:grid-cols-[1.35fr_1fr]"
          )}
        >
          {operationsPanel}
          {managementPanel}
        </div>
      ) : null}
    </div>
  );
}

function SalesPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { salesPerformance, topProducts } = snapshot;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card className="border border-border/70 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Revenue mix</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryChartConfig} className="min-h-[340px] w-full">
            <BarChart data={salesPerformance}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={10} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                tickLine={false}
                width={46}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="devices" fill="var(--color-devices)" radius={0} />
              <Bar dataKey="accessories" fill="var(--color-accessories)" radius={0} />
              <Bar dataKey="services" fill="var(--color-services)" radius={0} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border border-border/70 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Top products</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {topProducts.map((item) => (
            <div
              key={item.name}
              className="flex flex-col gap-2 rounded-none border border-border/70 bg-background/40 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{item.name}</div>
                <Badge variant="secondary">{item.units} units</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{currency.format(item.revenue)}</span>
                <span>{item.margin.toFixed(1)}% margin</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { inventoryHealth } = snapshot;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <Card className="border border-border/70 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Inventory pressure</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={inventoryChartConfig} className="min-h-[340px] w-full">
            <BarChart data={inventoryHealth}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="sku"
                tickLine={false}
                tickMargin={10}
              />
              <YAxis axisLine={false} tickLine={false} width={38} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="onHand" fill="var(--color-onHand)" radius={0} />
              <Bar dataKey="reorderPoint" fill="var(--color-reorderPoint)" radius={0} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border border-border/70 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Restock queue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {inventoryHealth.map((item) => (
            <div
              key={item.sku}
              className="flex flex-col gap-2 rounded-none border border-border/70 bg-background/40 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{item.name}</div>
                <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{item.onHand} units on hand</span>
                <span>{item.reorderPoint} unit trigger</span>
                <span>{item.coverageWeeks.toFixed(1)} weeks cover</span>
                <span>{item.nextDelivery}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SuppliersPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { supplierSnapshots } = snapshot;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <div className="grid gap-4 md:grid-cols-2">
        {supplierSnapshots.map((supplier) => (
          <Card key={supplier.name} className="border border-border/70 bg-card/85 backdrop-blur">
            <CardHeader>
              <CardTitle>{supplier.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-none border border-border/70 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">Reliability</div>
                <div className="mt-1 font-display text-3xl leading-none">
                  {supplier.reliability}%
                </div>
              </div>
              <div className="rounded-none border border-border/70 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">Lead time</div>
                <div className="mt-1 font-display text-3xl leading-none">
                  {supplier.leadDays}d
                </div>
              </div>
              <div className="rounded-none border border-border/70 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">Open orders</div>
                <div className="mt-1 text-sm font-medium">{supplier.openOrders}</div>
              </div>
              <div className="rounded-none border border-border/70 bg-background/40 p-3">
                <div className="text-xs text-muted-foreground">Fill rate</div>
                <div className="mt-1 text-sm font-medium">{supplier.fillRate}%</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Empty className="border border-border/70 bg-card/85 p-8 backdrop-blur">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheckIcon />
          </EmptyMedia>
          <EmptyTitle>No supplier escalations</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

function ForecastPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { demandForecast, alertFeed } = snapshot;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card className="border border-border/70 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle>Demand forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={forecastChartConfig} className="min-h-[340px] w-full">
            <LineChart data={demandForecast}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="week" tickLine={false} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} width={38} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="actual"
                dot={false}
                stroke="var(--color-actual)"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="forecast"
                dot={false}
                stroke="var(--color-forecast)"
                strokeDasharray="6 4"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        {alertFeed.map((alert) => (
          <Alert
            key={alert.title}
            variant={alert.severity === "critical" ? "destructive" : "default"}
            className="border-border/70 bg-card/85 backdrop-blur"
          >
            <BellRingIcon />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.detail}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-none" />
        <Skeleton className="h-28 rounded-none" />
        <Skeleton className="h-28 rounded-none" />
        <Skeleton className="h-28 rounded-none" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="min-h-[320px] rounded-none" />
        <div className="grid gap-4">
          <Skeleton className="h-36 rounded-none" />
          <Skeleton className="h-36 rounded-none" />
        </div>
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

type OperationsConsoleData = {
  products: readonly {
    sku: string;
    name: string;
    supplier: string;
    onHand: number;
    unitPrice: number;
    status: "healthy" | "watch" | "critical";
  }[];
  suppliers: readonly {
    name: string;
    averageLeadDays: number;
    fillRate: number;
    reliability: number;
    openOrders: number;
    nextDelivery: string;
  }[];
  recentActivity: readonly {
    id: string;
    kind: "sale" | "receipt" | "supplier";
    title: string;
    detail: string;
    createdAt: string;
  }[];
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
    <Card className="border border-border/70 bg-card/92">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <UsersIcon className="size-4" />
          Operator roles
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!users ? (
          <>
            <Skeleton className="h-16 rounded-none" />
            <Skeleton className="h-16 rounded-none" />
          </>
        ) : users.length === 0 ? (
          <div className="border border-border/70 bg-background/55 p-4 text-sm text-muted-foreground">
            No authenticated operators synced yet.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="flex flex-col gap-3 border border-border/70 bg-background/55 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.email ?? "No email"} · {user.companyName}
                </div>
              </div>
              <Select
                disabled={pendingUserId === user._id}
                value={user.role}
                onValueChange={(value) => onUpdateRole(user._id, value as DashboardViewer["role"])}
              >
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function OperationsConsolePanel({
  consoleData,
  pendingAction,
  onRecordSale,
  onReceiveStock,
}: {
  consoleData: OperationsConsoleData | undefined;
  pendingAction: "sale" | "receipt" | null;
  onRecordSale: (args: {
    sku: string;
    quantity: number;
    channel: "retail" | "online" | "service";
  }) => Promise<void>;
  onReceiveStock: (args: {
    sku: string;
    quantity: number;
    supplierName: string;
    leadDays: number;
    fillRate: number;
    nextDelivery?: string;
  }) => Promise<void>;
}) {
  const [saleSku, setSaleSku] = useState("");
  const [saleQty, setSaleQty] = useState("1");
  const [saleChannel, setSaleChannel] = useState<"retail" | "online" | "service">("retail");

  const [receiptSku, setReceiptSku] = useState("");
  const [receiptQty, setReceiptQty] = useState("1");
  const [receiptSupplier, setReceiptSupplier] = useState("");
  const [receiptLeadDays, setReceiptLeadDays] = useState("");
  const [receiptFillRate, setReceiptFillRate] = useState("");
  const [receiptNextDelivery, setReceiptNextDelivery] = useState("");

  const selectedReceiptProduct = useMemo(
    () => consoleData?.products.find((product) => product.sku === receiptSku),
    [consoleData, receiptSku]
  );

  const selectedSupplier = useMemo(
    () => consoleData?.suppliers.find((supplier) => supplier.name === receiptSupplier),
    [consoleData, receiptSupplier]
  );

  useEffect(() => {
    if (!consoleData?.products.length) {
      return;
    }
    setSaleSku((current) => current || consoleData.products[0]!.sku);
    setReceiptSku((current) => current || consoleData.products[0]!.sku);
  }, [consoleData]);

  useEffect(() => {
    if (!selectedReceiptProduct) {
      return;
    }
    setReceiptSupplier(selectedReceiptProduct.supplier);
  }, [selectedReceiptProduct]);

  useEffect(() => {
    if (!selectedSupplier) {
      return;
    }
    setReceiptLeadDays(String(selectedSupplier.averageLeadDays));
    setReceiptFillRate(String(selectedSupplier.fillRate));
    setReceiptNextDelivery(selectedSupplier.nextDelivery);
  }, [selectedSupplier]);

  return (
    <Card className="border border-border/70 bg-card/92">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShoppingCartIcon className="size-4" />
          Operations console
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!consoleData ? (
          <>
            <Skeleton className="h-44 rounded-none" />
            <Skeleton className="h-44 rounded-none" />
            <Skeleton className="h-28 rounded-none" />
          </>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border border-border/70 bg-background/55">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ShoppingCartIcon className="size-4" />
                    Record sale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const quantity = Number(saleQty);
                      if (!saleSku || !Number.isFinite(quantity) || quantity <= 0) {
                        toast.error("Enter a valid product and quantity");
                        return;
                      }
                      void onRecordSale({ sku: saleSku, quantity, channel: saleChannel }).then(() =>
                        setSaleQty("1")
                      );
                    }}
                  >
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="sale-sku">Product</Label>
                      <Select value={saleSku} onValueChange={(value) => setSaleSku(value ?? "")}>
                        <SelectTrigger id="sale-sku">
                          <SelectValue placeholder="Choose a product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {consoleData.products.map((product) => (
                              <SelectItem key={product.sku} value={product.sku}>
                                {product.name} · {product.onHand} on hand
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sale-qty">Quantity</Label>
                        <Input
                          id="sale-qty"
                          min="1"
                          step="1"
                          type="number"
                          value={saleQty}
                          onChange={(event) => setSaleQty(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sale-channel">Channel</Label>
                        <Select
                          value={saleChannel}
                          onValueChange={(value) =>
                            setSaleChannel(value as "retail" | "online" | "service")
                          }
                        >
                          <SelectTrigger id="sale-channel">
                            <SelectValue placeholder="Choose a channel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button disabled={pendingAction !== null} type="submit">
                      <ShoppingCartIcon data-icon="inline-start" />
                      {pendingAction === "sale" ? "Recording sale..." : "Commit sale"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border border-border/70 bg-background/55">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PackagePlusIcon className="size-4" />
                    Receive stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const quantity = Number(receiptQty);
                      const leadDays = Number(receiptLeadDays);
                      const fillRate = Number(receiptFillRate);
                      if (
                        !receiptSku ||
                        !receiptSupplier ||
                        !Number.isFinite(quantity) ||
                        !Number.isFinite(leadDays) ||
                        !Number.isFinite(fillRate) ||
                        quantity <= 0
                      ) {
                        toast.error("Enter valid stock receipt details");
                        return;
                      }
                      void onReceiveStock({
                        sku: receiptSku,
                        quantity,
                        supplierName: receiptSupplier,
                        leadDays,
                        fillRate,
                        nextDelivery: receiptNextDelivery || undefined,
                      }).then(() => setReceiptQty("1"));
                    }}
                  >
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="receipt-sku">Product</Label>
                      <Select value={receiptSku} onValueChange={(value) => setReceiptSku(value ?? "")}>
                        <SelectTrigger id="receipt-sku">
                          <SelectValue placeholder="Choose a product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {consoleData.products.map((product) => (
                              <SelectItem key={product.sku} value={product.sku}>
                                {product.name} · {product.supplier}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-qty">Units received</Label>
                        <Input
                          id="receipt-qty"
                          min="1"
                          step="1"
                          type="number"
                          value={receiptQty}
                          onChange={(event) => setReceiptQty(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-supplier">Supplier</Label>
                        <Select
                          value={receiptSupplier}
                          onValueChange={(value) => setReceiptSupplier(value ?? "")}
                        >
                          <SelectTrigger id="receipt-supplier">
                            <SelectValue placeholder="Choose a supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {consoleData.suppliers.map((supplier) => (
                                <SelectItem key={supplier.name} value={supplier.name}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-lead">Lead days</Label>
                        <Input
                          id="receipt-lead"
                          min="1"
                          step="0.5"
                          type="number"
                          value={receiptLeadDays}
                          onChange={(event) => setReceiptLeadDays(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-fill">Fill rate %</Label>
                        <Input
                          id="receipt-fill"
                          max="100"
                          min="1"
                          step="1"
                          type="number"
                          value={receiptFillRate}
                          onChange={(event) => setReceiptFillRate(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="receipt-next">Next delivery</Label>
                        <Input
                          id="receipt-next"
                          placeholder="Fri 16:00"
                          value={receiptNextDelivery}
                          onChange={(event) => setReceiptNextDelivery(event.target.value)}
                        />
                      </div>
                    </div>
                    <Button disabled={pendingAction !== null} type="submit" variant="outline">
                      <PackagePlusIcon data-icon="inline-start" />
                      {pendingAction === "receipt" ? "Posting receipt..." : "Post stock receipt"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-border/70 bg-background/55">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock3Icon className="size-4" />
                  Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {consoleData.recentActivity.length === 0 ? (
                  <div className="border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
                    No activity yet.
                  </div>
                ) : (
                  consoleData.recentActivity.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-2 border border-border/70 bg-card/70 p-3 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.title}</span>
                          <Badge variant="outline">{event.kind}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{event.detail}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
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
  const recordSale = useMutation(api.dashboard.recordSale);
  const receiveStock = useMutation(api.dashboard.receiveStock);
  const initializedRef = useRef(false);
  const [pendingUserId, setPendingUserId] = useState<Doc<"users">["_id"] | null>(null);
  const [pendingAction, setPendingAction] = useState<"sale" | "receipt" | null>(null);
  const canUseConvexAuth = isLive && isLoaded && !isConvexAuthLoading && isConvexAuthenticated;

  const persistedViewer = useQuery(api.dashboard.viewer, canUseConvexAuth ? {} : "skip");
  const canUsePersistedQueries = canUseConvexAuth && Boolean(persistedViewer);
  const snapshot = useQuery(api.dashboard.snapshot, canUsePersistedQueries ? {} : "skip");
  const effectiveRole = persistedViewer?.role ?? viewer.role;
  const users = useQuery(
    api.dashboard.listUsers,
    canUsePersistedQueries && effectiveRole === "manager" ? {} : "skip"
  );
  const operationsConsole = useQuery(
    api.dashboard.operationsConsole,
    canUsePersistedQueries ? {} : "skip"
  );
  const isLoadingLiveSnapshot =
    isLive &&
    (!isLoaded ||
      isConvexAuthLoading ||
      (canUseConvexAuth && (!persistedViewer || !snapshot || !operationsConsole)));

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
        await ensureSeedData({});
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to initialize dashboard");
        initializedRef.current = false;
      }
    })();
  }, [canUseConvexAuth, ensureSeedData, syncViewer, user]);

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

  const liveSnapshot = isLive ? (snapshot as DashboardSnapshot | undefined) : undefined;
  const displaySnapshot = liveSnapshot ?? demoDashboardSnapshot;
  const isInitialLoading = isLive && !liveSnapshot;
  const criticalAlerts = displaySnapshot.alertFeed.filter(
    (item) => item.severity === "critical"
  ).length;
  const showSkeleton = isInitialLoading || isLoadingLiveSnapshot;

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

  const operationsPanel =
    isLive && effectiveViewer.role !== "analyst" ? (
      <OperationsConsolePanel
        consoleData={operationsConsole as OperationsConsoleData | undefined}
        pendingAction={pendingAction}
        onRecordSale={async ({ sku, quantity, channel }) => {
          setPendingAction("sale");
          try {
            await recordSale({ sku, quantity, channel });
            toast.success("Sale recorded and forecasts refreshed");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to record sale");
          } finally {
            setPendingAction(null);
          }
        }}
        onReceiveStock={async ({ sku, quantity, supplierName, leadDays, fillRate, nextDelivery }) => {
          setPendingAction("receipt");
          try {
            await receiveStock({ sku, quantity, supplierName, leadDays, fillRate, nextDelivery });
            toast.success("Stock receipt posted and forecasts refreshed");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to post stock receipt");
          } finally {
            setPendingAction(null);
          }
        }}
      />
    ) : undefined;

  const content = (() => {
    if (showSkeleton) {
      return <DashboardLoadingState />;
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
        return (
          <OverviewPanel
            managementPanel={managementPanel}
            operationsPanel={operationsPanel}
            snapshot={displaySnapshot}
          />
        );
    }
  })();

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        activeSection={activeSection}
        availableSections={availableSections}
        criticalAlerts={criticalAlerts}
        viewer={effectiveViewer}
      />
      <SidebarInset className="border-0">
        <div className="flex min-h-svh flex-col">
          <header className="border-b border-border/70 bg-background/88 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger />
                <div className="flex min-w-0 flex-col">
                  <span className="font-display text-2xl leading-none text-foreground">
                    {dashboardSectionLabels[activeSection]}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="hidden sm:flex">
                  <RefreshCcwIcon data-icon="inline-start" />
                  {liveSnapshot?.dashboardSummary.liveSyncStatus ?? "Syncing"}
                </Badge>
                {criticalAlerts > 0 ? (
                  <Badge variant={severityVariant(displaySnapshot.alertFeed[0]?.severity ?? "info")}>
                    <CircleAlertIcon data-icon="inline-start" />
                    {criticalAlerts} alert{criticalAlerts === 1 ? "" : "s"}
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link
                      href={
                        availableSections.includes("inventory")
                          ? "/dashboard/inventory"
                          : "/dashboard/forecast"
                      }
                    >
                      <PackageSearchIcon className="size-3.5" />
                      {availableSections.includes("inventory") ? "Reorder queue" : "Forecast"}
                    </Link>
                  }
                />
              </div>
            </div>
          </header>
          <main className="techassure-surface relative flex-1 overflow-hidden">
            <div className="techassure-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative flex flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
              {content}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
