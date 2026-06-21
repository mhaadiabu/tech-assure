"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleAlertIcon,
  Loader2Icon,
  PackageIcon,
  PackagePlusIcon,
  SearchIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@_scaffold/ui/components/badge";
import { Button } from "@_scaffold/ui/components/button";
import { Input } from "@_scaffold/ui/components/input";
import { Label } from "@_scaffold/ui/components/label";
import { Skeleton } from "@_scaffold/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@_scaffold/ui/components/table";
import { api } from "@_scaffold/backend/convex/_generated/api";
import { cn } from "@_scaffold/ui/lib/utils";

type PosProduct = {
  sku: string;
  name: string;
  category: string;
  supplier: string;
  onHand: number;
  unitPrice: number;
  unitCost: number;
  status: "healthy" | "watch" | "critical";
};

type PosSupplier = {
  name: string;
  averageLeadDays: number;
  fillRate: number;
  reliability: number;
  openOrders: number;
  nextDelivery: string;
};

type PosSession = {
  products: readonly PosProduct[];
  suppliers: readonly PosSupplier[];
  todayRevenue: number;
  todayUnits: number;
  recentActivity: readonly {
    id: string;
    kind: "sale" | "receipt" | "supplier";
    title: string;
    detail: string;
    createdAt: string;
    actorName: string | null;
  }[];
};

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

const SALE_CHANNELS = ["retail", "online", "service"] as const;
type SaleChannel = (typeof SALE_CHANNELS)[number];

function statusVariant(status: PosProduct["status"]) {
  if (status === "critical") return "destructive" as const;
  if (status === "watch") return "outline" as const;
  return "secondary" as const;
}

function ProductPicker({
  products,
  selectedSku,
  onSelect,
}: {
  products: readonly PosProduct[];
  selectedSku: string;
  onSelect: (sku: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      set.add(product.category);
    }
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category !== "all" && product.category !== category) {
        return false;
      }
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle)
      );
    });
  }, [products, query, category]);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Catalog</h2>
            <p className="text-xs text-muted-foreground">Pick a product to ring up</p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {filtered.length} items
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              className="h-8 pl-8 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or SKU"
              value={query}
            />
          </div>
          <select
            aria-label="Filter by category"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="max-h-[420px] flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-muted-foreground">
            No products match your filters.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((product) => {
              const active = product.sku === selectedSku;
              const lowStock = product.onHand <= 0;
              const tightStock = !lowStock && product.onHand < 5;
              return (
                <li key={product.sku}>
                  <button
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                      "hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:outline-none",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      active && "bg-muted/60"
                    )}
                    disabled={lowStock}
                    onClick={() => onSelect(product.sku)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {product.name}
                        </span>
                        <Badge variant={statusVariant(product.status)} className="text-[10px]">
                          {product.status}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{product.sku}</span>
                        <span>·</span>
                        <span>{product.category}</span>
                        <span>·</span>
                        <span>{product.supplier}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {currency.format(product.unitPrice)}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] tabular-nums",
                          lowStock
                            ? "text-destructive"
                            : tightStock
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        )}
                      >
                        {product.onHand} on hand
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function SaleForm({
  product,
  quantity,
  channel,
  pending,
  onQuantityChange,
  onChannelChange,
  onSubmit,
  onReset,
}: {
  product: PosProduct | undefined;
  quantity: string;
  channel: SaleChannel;
  pending: boolean;
  onQuantityChange: (value: string) => void;
  onChannelChange: (value: SaleChannel) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const numericQuantity = Number(quantity);
  const validQuantity =
    Number.isFinite(numericQuantity) && numericQuantity > 0 && Number.isInteger(numericQuantity);
  const exceedsStock =
    product !== undefined && validQuantity && numericQuantity > product.onHand;
  const disabled = pending || !product || !validQuantity || exceedsStock;

  const total = product && validQuantity ? product.unitPrice * numericQuantity : 0;

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Record sale</h2>
          <p className="text-xs text-muted-foreground">Ring up a transaction</p>
        </div>
      </header>
      <form
        className="flex flex-col gap-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {!product ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background/40 px-4 py-6 text-center text-sm text-muted-foreground">
            <CircleAlertIcon className="size-4" />
            <span>Select a product to start a sale.</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{product.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {product.sku} · {product.category}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold tabular-nums text-foreground">
                  {currency.format(product.unitPrice)}
                </div>
                <div className="text-[11px] tabular-nums text-muted-foreground">
                  {product.onHand} on hand
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pos-qty">Quantity</Label>
                <Input
                  id="pos-qty"
                  min="1"
                  step="1"
                  type="number"
                  value={quantity}
                  onChange={(event) => onQuantityChange(event.target.value)}
                />
                {exceedsStock ? (
                  <span className="text-[11px] text-destructive">
                    Only {product.onHand} units available.
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pos-channel">Channel</Label>
                <select
                  id="pos-channel"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  onChange={(event) => onChannelChange(event.target.value as SaleChannel)}
                  value={channel}
                >
                  {SALE_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2.5">
              <span className="text-xs text-muted-foreground">Sale total</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {currency.format(total)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button disabled={disabled} type="submit" className="flex-1">
                {pending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <ShoppingCartIcon className="size-3.5" />
                )}
                {pending ? "Posting..." : "Ring up sale"}
              </Button>
              <Button disabled={pending} onClick={onReset} type="button" variant="outline">
                Clear
              </Button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}

function ReceiveStockPanel({
  suppliers,
  products,
}: {
  suppliers: readonly PosSupplier[];
  products: readonly PosProduct[];
}) {
  const receiveStock = useMutation(api.dashboard.receiveStock);
  const [open, setOpen] = useState(false);
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [supplierName, setSupplierName] = useState("");
  const [leadDays, setLeadDays] = useState("");
  const [fillRate, setFillRate] = useState("");
  const [pending, setPending] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.sku === sku),
    [products, sku]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.name === supplierName),
    [suppliers, supplierName]
  );

  const numericQuantity = Number(quantity);
  const numericLead = Number(leadDays);
  const numericFill = Number(fillRate);
  const valid =
    sku.length > 0 &&
    supplierName.length > 0 &&
    Number.isFinite(numericQuantity) &&
    numericQuantity > 0 &&
    Number.isFinite(numericLead) &&
    numericLead > 0 &&
    Number.isFinite(numericFill) &&
    numericFill > 0 &&
    numericFill <= 100;

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Receive stock</h2>
          <p className="text-xs text-muted-foreground">Log a stock receipt from a supplier</p>
        </div>
        <Button onClick={() => setOpen((current) => !current)} size="sm" variant="ghost">
          {open ? "Hide" : "Show"}
        </Button>
      </header>
      {open ? (
        <form
          className="grid gap-3 p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid || pending) return;
            setPending(true);
            void receiveStock({
              sku,
              quantity: numericQuantity,
              supplierName,
              leadDays: numericLead,
              fillRate: numericFill,
            })
              .then(() => {
                toast.success("Stock receipt posted");
                setQuantity("1");
              })
              .catch((error) =>
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to post stock receipt"
                )
              )
              .finally(() => setPending(false));
          }}
        >
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="receipt-sku">Product</Label>
            <select
              id="receipt-sku"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
              onChange={(event) => {
                const next = event.target.value;
                setSku(next);
                const match = products.find((p) => p.sku === next);
                if (match && !supplierName) {
                  setSupplierName(match.supplier);
                }
              }}
              value={sku}
            >
              <option value="">Choose a product</option>
              {products.map((product) => (
                <option key={product.sku} value={product.sku}>
                  {product.name} · {product.supplier}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="receipt-supplier">Supplier</Label>
            <select
              id="receipt-supplier"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
              onChange={(event) => {
                const next = event.target.value;
                setSupplierName(next);
                const match = suppliers.find((s) => s.name === next);
                if (match) {
                  setLeadDays(String(match.averageLeadDays));
                  setFillRate(String(match.fillRate));
                }
              }}
              value={supplierName}
            >
              <option value="">Choose a supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.name} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="receipt-qty">Units received</Label>
            <Input
              id="receipt-qty"
              min="1"
              step="1"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="receipt-lead">Lead days</Label>
            <Input
              id="receipt-lead"
              min="1"
              step="0.5"
              type="number"
              value={leadDays}
              onChange={(event) => setLeadDays(event.target.value)}
              placeholder={selectedSupplier ? String(selectedSupplier.averageLeadDays) : "3"}
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
              value={fillRate}
              onChange={(event) => setFillRate(event.target.value)}
              placeholder={selectedSupplier ? String(selectedSupplier.fillRate) : "95"}
            />
          </div>
          <div className="sm:col-span-2">
            <Button disabled={!valid || pending} type="submit" variant="outline" className="w-full">
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PackagePlusIcon className="size-3.5" />
              )}
              {pending ? "Posting..." : "Post stock receipt"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function ActivityPanel({
  activity,
  todayRevenue,
  todayUnits,
}: {
  activity: PosSession["recentActivity"];
  todayRevenue: number;
  todayUnits: number;
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Today</h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
          <div className="bg-background px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <TrendingUpIcon className="size-3" />
              Revenue
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {currency.format(todayRevenue)}
            </div>
          </div>
          <div className="bg-background px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <CheckIcon className="size-3" />
              Units
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {todayUnits}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <h3 className="px-4 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Session activity
        </h3>
        {activity.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No activity yet. Ring up a sale to get started.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activity.map((event) => (
              <li key={event.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {event.title}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {event.kind}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {new Date(event.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
                {event.actorName ? (
                  <p className="text-[11px] text-muted-foreground">by {event.actorName}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PosPanelSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[520px] rounded-lg" />
        <Skeleton className="h-[280px] rounded-lg" />
      </div>
      <Skeleton className="h-[520px] rounded-lg" />
    </div>
  );
}

function PosAuthRequired() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-8 py-12 text-center">
      <AlertTriangleIcon className="size-6 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Sign in to use the POS</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The TechAssure point of sale needs an authenticated operator to load products and record
        sales against the Convex dataset.
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

export default function PosPanel({
  authEnabled,
  isAuthenticated,
  convexReady,
  canReceiveStock,
}: {
  authEnabled: boolean;
  isAuthenticated: boolean;
  convexReady: boolean;
  canReceiveStock: boolean;
}) {
  const canQuery = authEnabled && isAuthenticated && convexReady;
  const session = useQuery(api.dashboard.posSession, canQuery ? {} : "skip");
  const recordSale = useMutation(api.dashboard.recordSale);
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [channel, setChannel] = useState<SaleChannel>("retail");
  const [pending, setPending] = useState(false);

  const data = session as PosSession | undefined;

  const products = data?.products ?? [];
  const selectedProduct = useMemo(
    () => products.find((product) => product.sku === selectedSku) ?? products[0],
    [products, selectedSku]
  );

  if (!canQuery) {
    return <PosAuthRequired />;
  }

  if (!data) {
    return <PosPanelSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <ProductPicker
            products={products}
            selectedSku={selectedProduct?.sku ?? ""}
            onSelect={(sku) => {
              setSelectedSku(sku);
              setQuantity("1");
            }}
          />
          <SaleForm
            channel={channel}
            pending={pending}
            product={selectedProduct}
            quantity={quantity}
            onChannelChange={setChannel}
            onQuantityChange={setQuantity}
            onReset={() => {
              setQuantity("1");
            }}
            onSubmit={() => {
              if (!selectedProduct) return;
              const numericQuantity = Number(quantity);
              if (
                !Number.isFinite(numericQuantity) ||
                numericQuantity <= 0 ||
                !Number.isInteger(numericQuantity)
              ) {
                toast.error("Quantity must be a positive whole number");
                return;
              }
              if (numericQuantity > selectedProduct.onHand) {
                toast.error("Cannot sell more units than are on hand");
                return;
              }
              setPending(true);
              void recordSale({
                sku: selectedProduct.sku,
                quantity: numericQuantity,
                channel,
              })
                .then(() => {
                  toast.success("Sale recorded", {
                    description: `${numericQuantity} × ${selectedProduct.name} on ${channel}.`,
                  });
                  setQuantity("1");
                })
                .catch((error) =>
                  toast.error(
                    error instanceof Error ? error.message : "Unable to record sale"
                  )
                )
                .finally(() => setPending(false));
            }}
          />
        </div>
        <ActivityPanel
          activity={data.recentActivity}
          todayRevenue={data.todayRevenue}
          todayUnits={data.todayUnits}
        />
      </div>
      {canReceiveStock ? (
        <ReceiveStockPanel products={products} suppliers={data.suppliers} />
      ) : null}
    </div>
  );
}
