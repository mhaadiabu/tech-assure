import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("manager"),
      v.literal("cashier"),
      v.literal("analyst"),
      v.literal("operations")
    ),
    companyName: v.optional(v.string()),
    location: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_external_id", ["externalId"]),
  suppliers: defineTable({
    name: v.string(),
    category: v.string(),
    contactEmail: v.string(),
    averageLeadDays: v.number(),
    reliabilityScore: v.number(),
    nextDelivery: v.string(),
    openOrders: v.number(),
    fillRate: v.number(),
    notes: v.optional(v.string()),
  }).index("by_name", ["name"]),
  products: defineTable({
    sku: v.string(),
    name: v.string(),
    category: v.string(),
    supplierId: v.id("suppliers"),
    unitCost: v.number(),
    unitPrice: v.number(),
    onHand: v.number(),
    reorderPoint: v.number(),
    leadDays: v.number(),
    weeklyVelocity: v.number(),
    shelfZone: v.string(),
    status: v.union(v.literal("healthy"), v.literal("watch"), v.literal("critical")),
  })
    .index("by_sku", ["sku"])
    .index("by_supplier", ["supplierId"]),
  sales: defineTable({
    soldAt: v.string(),
    sku: v.string(),
    quantity: v.number(),
    revenue: v.number(),
    grossMargin: v.number(),
    channel: v.union(v.literal("retail"), v.literal("online"), v.literal("service")),
    productCategory: v.string(),
  })
    .index("by_sku", ["sku"])
    .index("by_date", ["soldAt"]),
  forecasts: defineTable({
    sku: v.string(),
    weekStart: v.string(),
    predictedUnits: v.number(),
    actualUnits: v.optional(v.number()),
    confidence: v.number(),
    stockOutRisk: v.number(),
  })
    .index("by_sku", ["sku"])
    .index("by_week", ["weekStart"]),
  alerts: defineTable({
    title: v.string(),
    detail: v.string(),
    severity: v.union(v.literal("info"), v.literal("watch"), v.literal("critical")),
    kind: v.union(
      v.literal("stockout"),
      v.literal("anomaly"),
      v.literal("supplier"),
      v.literal("opportunity")
    ),
    sku: v.optional(v.string()),
    open: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_open", ["open"])
    .index("by_severity", ["severity"]),
  recommendations: defineTable({
    title: v.string(),
    detail: v.string(),
    impact: v.string(),
  }).index("by_title", ["title"]),
  activityEvents: defineTable({
    kind: v.union(v.literal("sale"), v.literal("receipt"), v.literal("supplier")),
    title: v.string(),
    detail: v.string(),
    sku: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    quantity: v.optional(v.number()),
    actorName: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_kind", ["kind"]),
});
