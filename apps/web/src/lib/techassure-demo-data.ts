export type DashboardRole = "manager" | "analyst" | "operations";
export type DashboardSection =
  | "overview"
  | "sales"
  | "inventory"
  | "suppliers"
  | "forecast";

export const dashboardSectionsByRole: Record<DashboardRole, readonly DashboardSection[]> = {
  manager: ["overview", "sales", "inventory", "suppliers", "forecast"],
  analyst: ["overview", "sales", "forecast"],
  operations: ["overview", "inventory", "suppliers", "forecast"],
};

export const dashboardSectionLabels: Record<DashboardSection, string> = {
  overview: "Overview",
  sales: "Sales pulse",
  inventory: "Inventory health",
  suppliers: "Supplier network",
  forecast: "Predictive insight lab",
};

export const dashboardSummary = {
  monthlyRevenue: 184200,
  monthlyRevenueChange: 0.126,
  grossMargin: 0.243,
  grossMarginChange: 0.019,
  sellThroughRate: 0.963,
  sellThroughRateChange: 0.022,
  forecastAccuracy: 0.914,
  forecastAccuracyChange: 0.031,
  atRiskSkus: 4,
  urgentSupplierIssues: 1,
  liveSyncStatus: "Demo dataset active",
};

export const roleViews: Record<
  DashboardRole,
  {
    label: string;
    strap: string;
    focus: string;
    priority: string;
    recommendation: string;
  }
> = {
  manager: {
    label: "Branch manager",
    strap: "Decision support for profit, stock cover, and supplier timing.",
    focus: "Margin discipline",
    priority: "Rebalance working capital into faster accessories and service bundles.",
    recommendation: "Push a Friday bundle campaign for laptops + accessories before the next replenishment wave.",
  },
  analyst: {
    label: "Business analyst",
    strap: "Pattern tracking for demand shifts, anomaly detection, and forecast confidence.",
    focus: "Signal quality",
    priority: "Demand variance is clustering around premium devices and mid-range chargers.",
    recommendation: "Audit March-to-May demand spikes and tune reorder weights for phones and power banks.",
  },
  operations: {
    label: "Operations lead",
    strap: "Execution view for reorder urgency, supplier follow-up, and shelf availability.",
    focus: "Shelf continuity",
    priority: "Battery accessories and entry laptops are closest to stock-out this week.",
    recommendation: "Escalate BlueOrbit Logistics and shift overflow demand to Accra Device Hub for three SKUs.",
  },
};

export const salesPerformance = [
  { month: "Jan", revenue: 126000, orders: 318, margin: 22.2, accessories: 22000, devices: 88000, services: 16000 },
  { month: "Feb", revenue: 134800, orders: 341, margin: 22.8, accessories: 23800, devices: 92500, services: 18500 },
  { month: "Mar", revenue: 141500, orders: 356, margin: 23.4, accessories: 25100, devices: 96800, services: 19600 },
  { month: "Apr", revenue: 156400, orders: 392, margin: 24.3, accessories: 28900, devices: 104700, services: 22800 },
  { month: "May", revenue: 171600, orders: 427, margin: 24.8, accessories: 31400, devices: 116200, services: 24000 },
  { month: "Jun", revenue: 184200, orders: 463, margin: 24.3, accessories: 34800, devices: 123500, services: 25900 },
];

export const demandForecast = [
  { week: "W1", actual: 76, forecast: 82, phones: 46, accessories: 24, laptops: 12 },
  { week: "W2", actual: 84, forecast: 87, phones: 51, accessories: 25, laptops: 11 },
  { week: "W3", actual: 89, forecast: 91, phones: 55, accessories: 24, laptops: 12 },
  { week: "W4", actual: 93, forecast: 96, phones: 57, accessories: 26, laptops: 13 },
  { week: "W5", actual: 0, forecast: 102, phones: 61, accessories: 28, laptops: 13 },
  { week: "W6", actual: 0, forecast: 107, phones: 64, accessories: 29, laptops: 14 },
];

export const inventoryHealth = [
  {
    sku: "TA-IP15-128",
    name: "iPhone 15 128GB",
    category: "Phones",
    onHand: 9,
    reorderPoint: 12,
    weeklyVelocity: 6.1,
    coverageWeeks: 1.5,
    supplier: "Accra Device Hub",
    nextDelivery: "Mon 13:00",
    status: "critical" as const,
  },
  {
    sku: "TA-HP-ELB",
    name: "HP EliteBook 840",
    category: "Laptops",
    onHand: 6,
    reorderPoint: 5,
    weeklyVelocity: 2.2,
    coverageWeeks: 2.7,
    supplier: "BlueOrbit Logistics",
    nextDelivery: "Wed 11:30",
    status: "watch" as const,
  },
  {
    sku: "TA-PB-20K",
    name: "Power Bank 20,000mAh",
    category: "Accessories",
    onHand: 18,
    reorderPoint: 24,
    weeklyVelocity: 13.4,
    coverageWeeks: 1.3,
    supplier: "VoltLine Ghana",
    nextDelivery: "Tomorrow",
    status: "critical" as const,
  },
  {
    sku: "TA-KB-MX",
    name: "Mechanical Keyboard MX",
    category: "Accessories",
    onHand: 22,
    reorderPoint: 14,
    weeklyVelocity: 5.3,
    coverageWeeks: 4.1,
    supplier: "VoltLine Ghana",
    nextDelivery: "Fri 16:00",
    status: "healthy" as const,
  },
  {
    sku: "TA-CH-65W",
    name: "65W GaN Charger",
    category: "Accessories",
    onHand: 14,
    reorderPoint: 18,
    weeklyVelocity: 9.6,
    coverageWeeks: 1.5,
    supplier: "BlueOrbit Logistics",
    nextDelivery: "Delayed 2d",
    status: "watch" as const,
  },
];

export const topProducts = [
  { name: "iPhone 15 128GB", units: 38, revenue: 41800, margin: 23.8 },
  { name: "HP EliteBook 840", units: 16, revenue: 30400, margin: 18.4 },
  { name: "65W GaN Charger", units: 62, revenue: 16120, margin: 31.2 },
  { name: "Power Bank 20,000mAh", units: 54, revenue: 14580, margin: 28.9 },
];

export const supplierSnapshots = [
  {
    name: "Accra Device Hub",
    reliability: 96,
    leadDays: 3,
    openOrders: 2,
    fillRate: 98,
    note: "Consistent on flagship phones and laptop refresh cycles.",
  },
  {
    name: "BlueOrbit Logistics",
    reliability: 74,
    leadDays: 6,
    openOrders: 3,
    fillRate: 81,
    note: "Two-day variance on chargers and entry-level laptops.",
  },
  {
    name: "VoltLine Ghana",
    reliability: 91,
    leadDays: 2,
    openOrders: 1,
    fillRate: 95,
    note: "High confidence for accessories and peripherals.",
  },
];

export const alertFeed = [
  {
    title: "Stock-out window inside 3 days",
    detail: "Power banks and iPhone 15 units are likely to dip below safe cover before the next intake lands.",
    severity: "critical" as const,
  },
  {
    title: "Supplier delay variance detected",
    detail: "BlueOrbit Logistics is running 32% slower than its baseline for charger deliveries.",
    severity: "watch" as const,
  },
  {
    title: "Demand uplift opportunity",
    detail: "Accessory attach rate has moved from 1.6x to 1.9x on premium phone purchases.",
    severity: "info" as const,
  },
];

export const recommendations = [
  {
    title: "Increase charger safety stock",
    detail: "Raise reorder point from 18 to 24 units while supplier variance remains elevated.",
    impact: "Protects 2.1 weeks of demand",
  },
  {
    title: "Bundle flagship phones with power banks",
    detail: "Cross-sell promotion can lift accessory revenue without increasing device markdown pressure.",
    impact: "Projected +8.4% bundle margin",
  },
  {
    title: "Shift one open PO to Accra Device Hub",
    detail: "Split the delayed laptop replenishment across the more reliable distributor.",
    impact: "Cuts stock-out risk on entry laptops by 19%",
  },
];

export type DashboardSnapshot = {
  dashboardSummary: typeof dashboardSummary;
  salesPerformance: typeof salesPerformance;
  demandForecast: typeof demandForecast;
  inventoryHealth: typeof inventoryHealth;
  topProducts: typeof topProducts;
  supplierSnapshots: typeof supplierSnapshots;
  alertFeed: typeof alertFeed;
  recommendations: typeof recommendations;
};

export const demoDashboardSnapshot: DashboardSnapshot = {
  dashboardSummary,
  salesPerformance,
  demandForecast,
  inventoryHealth,
  topProducts,
  supplierSnapshots,
  alertFeed,
  recommendations,
};
