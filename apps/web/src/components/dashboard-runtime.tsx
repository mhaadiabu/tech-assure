"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@_scaffold/backend/convex/_generated/api";
import type { Doc } from "@_scaffold/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Clock3Icon,
  PackagePlusIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@_scaffold/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@_scaffold/ui/components/card";
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
import { Skeleton } from "@_scaffold/ui/components/skeleton";
import { Button } from "@_scaffold/ui/components/button";

import DashboardShell from "./dashboard-shell";
import type { DashboardViewer } from "@/lib/dashboard-auth";
import type { DashboardSnapshot } from "@/lib/techassure-demo-data";

type DashboardRuntimeProps = {
  initialViewer: DashboardViewer;
};

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

export default function DashboardRuntime({ initialViewer }: DashboardRuntimeProps) {
  const isLive = initialViewer.authMode === "clerk" && initialViewer.isAuthenticated;
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
  const effectiveRole = persistedViewer?.role ?? initialViewer.role;
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
          preferredRole: initialViewer.role,
        });
        await ensureSeedData({});
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to initialize dashboard");
        initializedRef.current = false;
      }
    })();
  }, [canUseConvexAuth, ensureSeedData, initialViewer.role, syncViewer, user]);

  const viewer = useMemo<DashboardViewer>(() => {
    if (!persistedViewer) {
      return initialViewer;
    }

    return {
      authMode: initialViewer.authMode,
      isAuthenticated: initialViewer.isAuthenticated,
      name: persistedViewer.name,
      email: persistedViewer.email,
      role: persistedViewer.role,
      companyName: persistedViewer.companyName,
    };
  }, [initialViewer, persistedViewer]);

  const managementPanel =
    isLive && viewer.role === "manager" ? (
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
    isLive && viewer.role !== "analyst" ? (
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

  return (
    <DashboardShell
      isLoading={isLoadingLiveSnapshot}
      managementPanel={managementPanel}
      operationsPanel={operationsPanel}
      snapshot={snapshot as DashboardSnapshot | undefined}
      viewer={viewer}
    />
  );
}
