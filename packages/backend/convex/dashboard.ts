import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { getSessionUser, requireRole, requireSessionUser } from "./lib/auth";
import {
  alertSeed,
  forecastSeed,
  productSeed,
  recommendationSeed,
  salesSeed,
  supplierSeed,
} from "./lib/seedData";

const roleValidator = v.union(v.literal("manager"), v.literal("analyst"), v.literal("operations"));
const channelValidator = v.union(v.literal("retail"), v.literal("online"), v.literal("service"));

type ProductDoc = Doc<"products">;
type SupplierDoc = Doc<"suppliers">;
type SaleDoc = Doc<"sales">;
type ForecastInsert = Omit<Doc<"forecasts">, "_id" | "_creationTime">;
type AlertInsert = Omit<Doc<"alerts">, "_id" | "_creationTime">;
type RecommendationInsert = Omit<Doc<"recommendations">, "_id" | "_creationTime">;

function inferRoleFromEmail(email: string | undefined) {
  const normalized = email?.toLowerCase() ?? "";
  if (
    normalized.includes("ops") ||
    normalized.includes("operations") ||
    normalized.includes("warehouse") ||
    normalized.includes("inventory")
  ) {
    return "operations" as const;
  }
  if (
    normalized.includes("analyst") ||
    normalized.includes("insight") ||
    normalized.includes("finance") ||
    normalized.includes("data")
  ) {
    return "analyst" as const;
  }
  return "manager" as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Number(value.toFixed(1));
}

function round3(value: number) {
  return Number(value.toFixed(3));
}

function normalizeDate(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }
  return parsed.toISOString().slice(0, 10);
}

function nowTimestamp() {
  return new Date().toISOString();
}

function parseDay(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return parsed;
}

function toMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

function average(values: readonly number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function weightedRecentAverage(values: readonly number[]) {
  const recent = values.slice(-3);
  const weights = recent.length === 1 ? [1] : recent.length === 2 ? [0.4, 0.6] : [0.2, 0.3, 0.5];
  return recent.reduce((total, value, index) => total + value * weights[index]!, 0);
}

function coefficientOfVariation(values: readonly number[]) {
  if (values.length === 0) {
    return 0;
  }
  const mean = average(values);
  if (mean === 0) {
    return 0;
  }
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance) / mean;
}

function deriveProductStatus(onHand: number, reorderPoint: number) {
  if (onHand <= reorderPoint) {
    return "critical" as const;
  }
  if (onHand <= reorderPoint * 1.35) {
    return "watch" as const;
  }
  return "healthy" as const;
}

function getAnchorDate(sales: readonly SaleDoc[]) {
  if (sales.length === 0) {
    return new Date();
  }

  return sales.reduce((latest, sale) => {
    const soldAt = parseDay(sale.soldAt);
    return soldAt.getTime() > latest.getTime() ? soldAt : latest;
  }, parseDay(sales[0]!.soldAt));
}

function buildMonthlyUnits(productSales: readonly SaleDoc[], anchorDate: Date) {
  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() - (5 - index), 1)
    );
    return toMonthKey(monthDate);
  });

  const totals = new Map(monthKeys.map((key) => [key, 0]));
  for (const sale of productSales) {
    const key = sale.soldAt.slice(0, 7);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + sale.quantity);
    }
  }

  return monthKeys.map((key) => ({
    key,
    label: monthLabelFromKey(key),
    units: totals.get(key) ?? 0,
  }));
}

function buildRecentActuals(productSales: readonly SaleDoc[], anchorDate: Date, fallbackUnits: number) {
  const anchorMs = anchorDate.getTime();
  const buckets = [0, 0, 0, 0];

  for (const sale of productSales) {
    const diffDays = Math.floor((anchorMs - parseDay(sale.soldAt).getTime()) / 86_400_000);
    if (diffDays < 0 || diffDays >= 28) {
      continue;
    }
    const bucket = 3 - Math.floor(diffDays / 7);
    buckets[bucket] += sale.quantity;
  }

  if (buckets.some((value) => value > 0)) {
    return buckets;
  }

  const fallbackSpread = [0.22, 0.24, 0.26, 0.28];
  return fallbackSpread.map((share) => Math.max(0, Math.round(fallbackUnits * share)));
}

function calculateWeeklyVelocity(
  productSales: readonly SaleDoc[],
  anchorDate: Date,
  fallbackVelocity: number
) {
  const anchorMs = anchorDate.getTime();
  let recent28 = 0;

  for (const sale of productSales) {
    const diffDays = Math.floor((anchorMs - parseDay(sale.soldAt).getTime()) / 86_400_000);
    if (diffDays >= 0 && diffDays < 28) {
      recent28 += sale.quantity;
    }
  }

  if (recent28 > 0) {
    return round1(recent28 / 4);
  }

  const monthlyUnits = buildMonthlyUnits(productSales, anchorDate).map((item) => item.units);
  const monthlyBaseline = weightedRecentAverage(monthlyUnits);
  return round1(Math.max(monthlyBaseline / 4, fallbackVelocity, 0.5));
}

function buildForecastRows(
  products: readonly ProductDoc[],
  salesBySku: Map<string, SaleDoc[]>,
  anchorDate: Date
) {
  const forecastRows: ForecastInsert[] = [];

  for (const product of products) {
    const productSales = salesBySku.get(product.sku) ?? [];
    const monthlyUnits = buildMonthlyUnits(productSales, anchorDate);
    const recentMonths = monthlyUnits.slice(-3).map((item) => item.units);
    const actualWeeks = buildRecentActuals(productSales, anchorDate, monthlyUnits.at(-1)?.units ?? 0);

    let recent28 = 0;
    let prior28 = 0;
    const anchorMs = anchorDate.getTime();
    for (const sale of productSales) {
      const diffDays = Math.floor((anchorMs - parseDay(sale.soldAt).getTime()) / 86_400_000);
      if (diffDays >= 0 && diffDays < 28) {
        recent28 += sale.quantity;
      } else if (diffDays >= 28 && diffDays < 56) {
        prior28 += sale.quantity;
      }
    }

    const monthlyBaseline = weightedRecentAverage(recentMonths);
    const recentWeekly = recent28 > 0 ? recent28 / 4 : monthlyBaseline / 4;
    const priorWeekly = prior28 > 0 ? prior28 / 4 : recentWeekly * 0.96;
    const baseWeekly =
      recent28 > 0 ? recentWeekly * 0.65 + (monthlyBaseline / 4) * 0.35 : Math.max(monthlyBaseline / 4, product.weeklyVelocity, 1);
    const growthRate =
      priorWeekly > 0 ? clamp((recentWeekly - priorWeekly) / priorWeekly, -0.15, 0.25) : 0.03;
    const confidence = clamp(0.95 - coefficientOfVariation(recentMonths) * 0.25, 0.78, 0.95);

    for (let index = 0; index < 6; index += 1) {
      const multiplier = 1 + growthRate * Math.min(index + 1, 4) * 0.35;
      const seasonality = index % 2 === 0 ? 1.02 : 0.99;
      const predictedUnits = Math.max(1, Math.round(baseWeekly * multiplier * seasonality));
      const leadWeeks = Math.max(product.leadDays / 7, 0.5);
      const projectedDemand = predictedUnits * Math.max(leadWeeks + index * 0.25, 1);
      const stockOutRisk = clamp(
        (projectedDemand - product.onHand) / Math.max(projectedDemand, 1),
        0.05,
        0.95
      );

      forecastRows.push({
        sku: product.sku,
        weekStart: `W${index + 1}`,
        predictedUnits,
        actualUnits: index < 4 ? actualWeeks[index] : undefined,
        confidence: round3(confidence),
        stockOutRisk: round3(stockOutRisk),
      });
    }
  }

  return forecastRows;
}

function buildAlerts(
  products: readonly ProductDoc[],
  suppliers: readonly SupplierDoc[],
  forecastRows: readonly ForecastInsert[]
) {
  const now = nowTimestamp();
  const highestRiskBySku = new Map<string, number>();

  for (const row of forecastRows) {
    highestRiskBySku.set(row.sku, Math.max(row.stockOutRisk, highestRiskBySku.get(row.sku) ?? 0));
  }

  const productAlerts = products
    .map((product) => ({
      product,
      risk: highestRiskBySku.get(product.sku) ?? 0,
    }))
    .filter(({ product, risk }) => product.status !== "healthy" || risk > 0.68)
    .sort((left, right) => right.risk - left.risk || left.product.onHand - right.product.onHand)
    .slice(0, 3)
    .map<AlertInsert>(({ product, risk }) => ({
      title:
        product.status === "critical"
          ? `${product.name} is below reorder cover`
          : `${product.name} is trending toward a stock-out`,
      detail: `${product.onHand} units on hand against a reorder point of ${product.reorderPoint}. Forecasted stock-out risk is ${Math.round(
        risk * 100
      )}%.`,
      severity: product.status === "critical" ? "critical" : "watch",
      kind: "stockout",
      sku: product.sku,
      open: true,
      createdAt: now,
    }));

  const supplierAlerts = suppliers
    .filter((supplier) => supplier.reliabilityScore < 85 || supplier.fillRate < 90)
    .sort((left, right) => left.reliabilityScore - right.reliabilityScore)
    .slice(0, 2)
    .map<AlertInsert>((supplier) => ({
      title: `${supplier.name} needs supplier follow-up`,
      detail: `Reliability is ${supplier.reliabilityScore}% with a ${supplier.fillRate}% fill rate across ${supplier.openOrders} open orders.`,
      severity: supplier.reliabilityScore < 78 ? "critical" : "watch",
      kind: "supplier",
      open: true,
      createdAt: now,
    }));

  const alerts = [...productAlerts, ...supplierAlerts];
  if (alerts.length > 0) {
    return alerts;
  }

  return [
    {
      title: "Operational baseline is stable",
      detail: "No acute stock or supplier issues were detected in the latest refresh.",
      severity: "info" as const,
      kind: "opportunity" as const,
      open: true,
      createdAt: now,
    },
  ];
}

function buildRecommendations(
  products: readonly ProductDoc[],
  suppliers: readonly SupplierDoc[],
  sales: readonly SaleDoc[],
  forecastRows: readonly ForecastInsert[]
) {
  const highestRiskBySku = new Map<string, number>();
  for (const row of forecastRows) {
    highestRiskBySku.set(row.sku, Math.max(row.stockOutRisk, highestRiskBySku.get(row.sku) ?? 0));
  }

  const riskProduct = [...products]
    .sort(
      (left, right) =>
        (highestRiskBySku.get(right.sku) ?? 0) - (highestRiskBySku.get(left.sku) ?? 0) ||
        left.onHand - right.onHand
    )[0];
  const weakestSupplier = [...suppliers].sort(
    (left, right) => left.reliabilityScore - right.reliabilityScore
  )[0];

  const productRevenue = new Map<string, { revenue: number; units: number; grossMargin: number }>();
  for (const sale of sales) {
    const current = productRevenue.get(sale.sku) ?? { revenue: 0, units: 0, grossMargin: 0 };
    current.revenue += sale.revenue;
    current.units += sale.quantity;
    current.grossMargin += sale.revenue * sale.grossMargin;
    productRevenue.set(sale.sku, current);
  }
  const bestSeller = [...products]
    .map((product) => ({
      product,
      revenue: productRevenue.get(product.sku)?.revenue ?? 0,
      margin:
        (productRevenue.get(product.sku)?.grossMargin ?? 0) /
        Math.max(productRevenue.get(product.sku)?.revenue ?? 1, 1),
    }))
    .sort((left, right) => right.revenue - left.revenue)[0];

  const recommendations: RecommendationInsert[] = [];

  if (riskProduct) {
    recommendations.push({
      title: `Replenish ${riskProduct.name}`,
      detail: `${riskProduct.onHand} units remain on hand while forecasted weekly demand is pressing against the reorder point.`,
      impact: `${Math.round((highestRiskBySku.get(riskProduct.sku) ?? 0) * 100)}% stock-out risk reduced`,
    });
  }

  if (weakestSupplier) {
    recommendations.push({
      title: `Rebalance exposure from ${weakestSupplier.name}`,
      detail: `The supplier is running at ${weakestSupplier.reliabilityScore}% reliability and ${weakestSupplier.fillRate}% fill rate.`,
      impact: `Protect ${weakestSupplier.openOrders} open orders`,
    });
  }

  if (bestSeller && bestSeller.revenue > 0) {
    recommendations.push({
      title: `Lean into ${bestSeller.product.name}`,
      detail: `It is currently the strongest revenue contributor with an estimated ${(bestSeller.margin * 100).toFixed(1)}% blended margin.`,
      impact: "Supports higher-margin demand capture",
    });
  }

  return recommendations.slice(0, 3);
}

async function replaceForecasts(ctx: MutationCtx, rows: readonly ForecastInsert[]) {
  const existing = await ctx.db.query("forecasts").collect();
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  for (const row of rows) {
    await ctx.db.insert("forecasts", row);
  }
}

async function replaceAlerts(ctx: MutationCtx, rows: readonly AlertInsert[]) {
  const existing = await ctx.db.query("alerts").collect();
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  for (const row of rows) {
    await ctx.db.insert("alerts", row);
  }
}

async function replaceRecommendations(ctx: MutationCtx, rows: readonly RecommendationInsert[]) {
  const existing = await ctx.db.query("recommendations").collect();
  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  for (const row of rows) {
    await ctx.db.insert("recommendations", row);
  }
}

async function rebuildOperationalState(ctx: MutationCtx) {
  const [products, suppliers, sales] = await Promise.all([
    ctx.db.query("products").collect(),
    ctx.db.query("suppliers").collect(),
    ctx.db.query("sales").collect(),
  ]);

  const anchorDate = getAnchorDate(sales);
  const salesBySku = new Map<string, SaleDoc[]>();
  for (const sale of sales) {
    const current = salesBySku.get(sale.sku) ?? [];
    current.push(sale);
    salesBySku.set(sale.sku, current);
  }

  const refreshedProducts: ProductDoc[] = [];
  for (const product of products) {
    const weeklyVelocity = calculateWeeklyVelocity(
      salesBySku.get(product.sku) ?? [],
      anchorDate,
      product.weeklyVelocity
    );
    const status = deriveProductStatus(product.onHand, product.reorderPoint);

    if (weeklyVelocity !== product.weeklyVelocity || status !== product.status) {
      await ctx.db.patch(product._id, { weeklyVelocity, status });
    }

    refreshedProducts.push({
      ...product,
      weeklyVelocity,
      status,
    });
  }

  const forecastRows = buildForecastRows(refreshedProducts, salesBySku, anchorDate);
  await replaceForecasts(ctx, forecastRows);
  await replaceAlerts(ctx, buildAlerts(refreshedProducts, suppliers, forecastRows));
  await replaceRecommendations(ctx, buildRecommendations(refreshedProducts, suppliers, sales, forecastRows));
}

export const syncViewer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    companyName: v.optional(v.string()),
    preferredRole: v.optional(roleValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const externalId = identity.subject ?? identity.tokenIdentifier;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique();

    const role = existing?.role ?? args.preferredRole ?? inferRoleFromEmail(args.email ?? identity.email);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email ?? identity.email,
        companyName: args.companyName ?? existing.companyName,
        location: existing.location ?? "Accra HQ",
      });

      return await ctx.db.get(existing._id);
    }

    const userId = await ctx.db.insert("users", {
      externalId,
      name: args.name,
      email: args.email ?? identity.email,
      role,
      companyName: args.companyName ?? "TechAssure",
      location: "Accra HQ",
      createdAt: now,
    });

    return await ctx.db.get(userId);
  },
});

export const ensureSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSessionUser(ctx);

    const existingSuppliers = await ctx.db.query("suppliers").take(1);
    if (existingSuppliers.length > 0) {
      await rebuildOperationalState(ctx);
      return { seeded: false };
    }

    const supplierIds = new Map<string, Id<"suppliers">>();
    for (const supplier of supplierSeed) {
      const id = await ctx.db.insert("suppliers", supplier);
      supplierIds.set(supplier.name, id);
    }

    for (const product of productSeed) {
      const supplierId = supplierIds.get(product.supplierName);
      if (!supplierId) {
        throw new Error(`Missing supplier for ${product.name}`);
      }

      await ctx.db.insert("products", {
        sku: product.sku,
        name: product.name,
        category: product.category,
        supplierId,
        unitCost: product.unitCost,
        unitPrice: product.unitPrice,
        onHand: product.onHand,
        reorderPoint: product.reorderPoint,
        leadDays: product.leadDays,
        weeklyVelocity: product.weeklyVelocity,
        shelfZone: product.shelfZone,
        status: product.status,
      });
    }

    for (const sale of salesSeed) {
      await ctx.db.insert("sales", sale);
    }

    for (const forecast of forecastSeed) {
      await ctx.db.insert("forecasts", forecast);
    }

    for (const alert of alertSeed) {
      await ctx.db.insert("alerts", alert);
    }

    for (const recommendation of recommendationSeed) {
      await ctx.db.insert("recommendations", recommendation);
    }

    await rebuildOperationalState(ctx);
    return { seeded: true };
  },
});

export const recordSale = mutation({
  args: {
    sku: v.string(),
    quantity: v.number(),
    channel: channelValidator,
    soldAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireSessionUser(ctx);
    requireRole(session.user, ["manager", "operations"]);

    if (args.quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    const product = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();

    if (!product) {
      throw new Error("Product not found");
    }
    if (product.onHand < args.quantity) {
      throw new Error("Cannot record a sale larger than current stock on hand");
    }

    const soldAt = normalizeDate(args.soldAt);
    const revenue = Number((product.unitPrice * args.quantity).toFixed(2));
    const grossMargin =
      product.unitPrice > 0
        ? round3((product.unitPrice - product.unitCost) / product.unitPrice)
        : 0;
    const nextOnHand = product.onHand - args.quantity;

    await ctx.db.insert("sales", {
      soldAt,
      sku: product.sku,
      quantity: args.quantity,
      revenue,
      grossMargin,
      channel: args.channel,
      productCategory: product.category,
    });

    await ctx.db.patch(product._id, {
      onHand: nextOnHand,
      status: deriveProductStatus(nextOnHand, product.reorderPoint),
    });

    await ctx.db.insert("activityEvents", {
      kind: "sale",
      title: `${product.name} sold`,
      detail: `${args.quantity} units booked through ${args.channel} on ${soldAt}. Revenue captured: GHS ${Math.round(
        revenue
      )}.`,
      sku: product.sku,
      quantity: args.quantity,
      actorName: session.user.name,
      createdAt: nowTimestamp(),
    });

    await rebuildOperationalState(ctx);
    return { ok: true };
  },
});

export const receiveStock = mutation({
  args: {
    sku: v.string(),
    quantity: v.number(),
    supplierName: v.optional(v.string()),
    receivedAt: v.optional(v.string()),
    leadDays: v.optional(v.number()),
    fillRate: v.optional(v.number()),
    nextDelivery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await requireSessionUser(ctx);
    requireRole(session.user, ["manager", "operations"]);

    if (args.quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    const product = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();

    if (!product) {
      throw new Error("Product not found");
    }

    const supplierName = args.supplierName;
    const supplier = supplierName
      ? await ctx.db
          .query("suppliers")
          .withIndex("by_name", (q) => q.eq("name", supplierName))
          .unique()
      : await ctx.db.get(product.supplierId);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const receivedAt = normalizeDate(args.receivedAt);
    const nextOnHand = product.onHand + args.quantity;
    const nextFillRate =
      args.fillRate !== undefined
        ? clamp(Math.round((supplier.fillRate + args.fillRate) / 2), 1, 100)
        : supplier.fillRate;
    const nextLeadDays =
      args.leadDays !== undefined ? round1((supplier.averageLeadDays + args.leadDays) / 2) : supplier.averageLeadDays;
    const nextReliability = clamp(
      Math.round(nextFillRate * 0.7 + Math.max(0, 100 - nextLeadDays * 4) * 0.3),
      45,
      99
    );

    await ctx.db.patch(product._id, {
      onHand: nextOnHand,
      status: deriveProductStatus(nextOnHand, product.reorderPoint),
      supplierId: supplier._id,
    });

    await ctx.db.patch(supplier._id, {
      averageLeadDays: nextLeadDays,
      fillRate: nextFillRate,
      reliabilityScore: nextReliability,
      openOrders: Math.max(0, supplier.openOrders - 1),
      nextDelivery: args.nextDelivery ?? supplier.nextDelivery,
    });

    await ctx.db.insert("activityEvents", {
      kind: "receipt",
      title: `${product.name} received into stock`,
      detail: `${args.quantity} units posted from ${supplier.name} on ${receivedAt}. Stock is now ${nextOnHand} units.`,
      sku: product.sku,
      supplierName: supplier.name,
      quantity: args.quantity,
      actorName: session.user.name,
      createdAt: nowTimestamp(),
    });

    await rebuildOperationalState(ctx);
    return { ok: true };
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const session = await getSessionUser(ctx);
    if (!session) {
      return null;
    }

    return {
      name: session.user.name,
      email: session.user.email ?? null,
      role: session.user.role,
      companyName: session.user.companyName ?? "TechAssure",
      location: session.user.location ?? "Accra HQ",
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const session = await requireSessionUser(ctx);
    requireRole(session.user, ["manager"]);

    const users = await ctx.db.query("users").collect();

    return users
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email ?? null,
        role: user.role,
        companyName: user.companyName ?? "TechAssure",
      }));
  },
});

export const operationsConsole = query({
  args: {},
  handler: async (ctx) => {
    await requireSessionUser(ctx);

    const [products, suppliers, activityEvents] = await Promise.all([
      ctx.db.query("products").collect(),
      ctx.db.query("suppliers").collect(),
      ctx.db.query("activityEvents").collect(),
    ]);

    const supplierById = new Map(suppliers.map((supplier) => [supplier._id, supplier]));

    return {
      products: products
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((product) => ({
          sku: product.sku,
          name: product.name,
          supplier: supplierById.get(product.supplierId)?.name ?? "Unknown supplier",
          onHand: product.onHand,
          unitPrice: product.unitPrice,
          status: product.status,
        })),
      suppliers: suppliers
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((supplier) => ({
          name: supplier.name,
          averageLeadDays: supplier.averageLeadDays,
          fillRate: supplier.fillRate,
          reliability: supplier.reliabilityScore,
          openOrders: supplier.openOrders,
          nextDelivery: supplier.nextDelivery,
        })),
      recentActivity: activityEvents
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6)
        .map((event) => ({
          id: event._id,
          kind: event.kind,
          title: event.title,
          detail: event.detail,
          createdAt: event.createdAt,
        })),
    };
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const session = await requireSessionUser(ctx);
    requireRole(session.user, ["manager"]);

    await ctx.db.patch(args.userId, { role: args.role });
    return await ctx.db.get(args.userId);
  },
});

export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    await requireSessionUser(ctx);

    const [suppliers, products, sales, forecasts, alerts, recommendations] = await Promise.all([
      ctx.db.query("suppliers").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("sales").collect(),
      ctx.db.query("forecasts").collect(),
      ctx.db.query("alerts").collect(),
      ctx.db.query("recommendations").collect(),
    ]);

    const supplierById = new Map(suppliers.map((supplier) => [supplier._id, supplier]));
    const productBySku = new Map(products.map((product) => [product.sku, product]));
    const monthMap = new Map<
      string,
      {
        label: string;
        revenue: number;
        orders: number;
        marginWeighted: number;
        accessories: number;
        devices: number;
        services: number;
      }
    >();

    for (const sale of sales) {
      const key = sale.soldAt.slice(0, 7);
      const current = monthMap.get(key) ?? {
        label: monthLabelFromKey(key),
        revenue: 0,
        orders: 0,
        marginWeighted: 0,
        accessories: 0,
        devices: 0,
        services: 0,
      };

      current.revenue += sale.revenue;
      current.orders += sale.quantity;
      current.marginWeighted += sale.revenue * sale.grossMargin;

      if (sale.productCategory === "Accessories") current.accessories += sale.revenue;
      if (sale.productCategory === "Services") current.services += sale.revenue;
      if (sale.productCategory === "Phones" || sale.productCategory === "Laptops") current.devices += sale.revenue;

      monthMap.set(key, current);
    }

    const salesPerformance = Array.from(monthMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, item]) => ({
        month: item.label,
        revenue: item.revenue,
        orders: item.orders,
        margin: item.revenue > 0 ? Number(((item.marginWeighted / item.revenue) * 100).toFixed(1)) : 0,
        accessories: item.accessories,
        devices: item.devices,
        services: item.services,
      }));

    const latestMonth = salesPerformance.at(-1);
    const previousMonth = salesPerformance.at(-2);

    const demandForecastMap = new Map<
      string,
      {
        week: string;
        actual: number;
        forecast: number;
        phones: number;
        accessories: number;
        laptops: number;
        accuracyTotal: number;
        count: number;
      }
    >();

    for (const forecast of forecasts) {
      const product = productBySku.get(forecast.sku);
      const current = demandForecastMap.get(forecast.weekStart) ?? {
        week: forecast.weekStart,
        actual: 0,
        forecast: 0,
        phones: 0,
        accessories: 0,
        laptops: 0,
        accuracyTotal: 0,
        count: 0,
      };

      current.actual += forecast.actualUnits ?? 0;
      current.forecast += forecast.predictedUnits;
      if (product?.category === "Phones") current.phones += forecast.predictedUnits;
      if (product?.category === "Laptops") current.laptops += forecast.predictedUnits;
      if (product?.category === "Accessories") current.accessories += forecast.predictedUnits;
      if (forecast.actualUnits !== undefined && forecast.predictedUnits > 0) {
        current.accuracyTotal +=
          1 - Math.abs(forecast.predictedUnits - forecast.actualUnits) / forecast.predictedUnits;
        current.count += 1;
      }

      demandForecastMap.set(forecast.weekStart, current);
    }

    const demandForecast = Array.from(demandForecastMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week, undefined, { numeric: true })
    );

    const forecastAccuracyValues = demandForecast
      .filter((item) => item.count > 0)
      .map((item) => item.accuracyTotal / item.count);
    const forecastAccuracy = average(forecastAccuracyValues);
    const recentAccuracy = average(forecastAccuracyValues.slice(-2));
    const earlierAccuracy = average(forecastAccuracyValues.slice(0, -2));

    const inventoryHealth = products
      .map((product) => {
        const supplier = supplierById.get(product.supplierId);
        return {
          sku: product.sku,
          name: product.name,
          category: product.category,
          onHand: product.onHand,
          reorderPoint: product.reorderPoint,
          weeklyVelocity: product.weeklyVelocity,
          coverageWeeks: Number((product.onHand / Math.max(product.weeklyVelocity, 1)).toFixed(1)),
          supplier: supplier?.name ?? "Unknown supplier",
          nextDelivery: supplier?.nextDelivery ?? "Unknown",
          status: product.status,
        };
      })
      .sort((a, b) => a.coverageWeeks - b.coverageWeeks);

    const topProductsMap = new Map<
      string,
      { name: string; units: number; revenue: number; marginWeighted: number }
    >();

    for (const sale of sales) {
      const product = productBySku.get(sale.sku);
      if (!product) continue;

      const current = topProductsMap.get(sale.sku) ?? {
        name: product.name,
        units: 0,
        revenue: 0,
        marginWeighted: 0,
      };
      current.units += sale.quantity;
      current.revenue += sale.revenue;
      current.marginWeighted += sale.revenue * sale.grossMargin;
      topProductsMap.set(sale.sku, current);
    }

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
      .map((item) => ({
        name: item.name,
        units: item.units,
        revenue: item.revenue,
        margin: item.revenue > 0 ? Number(((item.marginWeighted / item.revenue) * 100).toFixed(1)) : 0,
      }));

    const supplierSnapshots = suppliers
      .map((supplier) => ({
        name: supplier.name,
        reliability: supplier.reliabilityScore,
        leadDays: supplier.averageLeadDays,
        openOrders: supplier.openOrders,
        fillRate: supplier.fillRate,
        note: supplier.notes ?? "",
      }))
      .sort((a, b) => a.reliability - b.reliability);

    const totalOnHand = products.reduce((total, product) => total + product.onHand, 0);
    const latestOrders = latestMonth?.orders ?? 0;
    const previousOrders = previousMonth?.orders ?? 0;
    const sellThroughRate = latestOrders / Math.max(latestOrders + totalOnHand, 1);
    const previousSellThroughRate = previousOrders / Math.max(previousOrders + totalOnHand, 1);

    const dashboardSummary = {
      monthlyRevenue: latestMonth?.revenue ?? 0,
      monthlyRevenueChange:
        latestMonth && previousMonth
          ? (latestMonth.revenue - previousMonth.revenue) / Math.max(previousMonth.revenue, 1)
          : 0,
      grossMargin: latestMonth ? latestMonth.margin / 100 : 0,
      grossMarginChange:
        latestMonth && previousMonth ? (latestMonth.margin - previousMonth.margin) / 100 : 0,
      sellThroughRate: round3(sellThroughRate),
      sellThroughRateChange: round3(sellThroughRate - previousSellThroughRate),
      forecastAccuracy: round3(forecastAccuracy),
      forecastAccuracyChange: round3(recentAccuracy - earlierAccuracy),
      atRiskSkus: inventoryHealth.filter((item) => item.status !== "healthy").length,
      urgentSupplierIssues: supplierSnapshots.filter((item) => item.reliability < 80).length,
      liveSyncStatus: "Live operational dataset",
    };

    return {
      dashboardSummary,
      salesPerformance,
      demandForecast: demandForecast.map((item) => ({
        week: item.week,
        actual: item.actual,
        forecast: item.forecast,
        phones: item.phones,
        accessories: item.accessories,
        laptops: item.laptops,
      })),
      inventoryHealth,
      topProducts,
      supplierSnapshots,
      alertFeed: alerts
        .filter((alert) => alert.open)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((alert) => ({
          title: alert.title,
          detail: alert.detail,
          severity: alert.severity,
        })),
      recommendations: recommendations.map((item) => ({
        title: item.title,
        detail: item.detail,
        impact: item.impact,
      })),
    };
  },
});
