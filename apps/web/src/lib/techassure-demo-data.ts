export type DashboardRole = "manager" | "cashier" | "analyst" | "operations";
export type DashboardSection =
  | "overview"
  | "pos"
  | "sales"
  | "inventory"
  | "suppliers"
  | "forecast";

export const dashboardSectionsByRole: Record<DashboardRole, readonly DashboardSection[]> = {
  manager: ["overview", "pos", "sales", "inventory", "suppliers", "forecast"],
  cashier: ["overview", "pos", "sales"],
  analyst: ["overview", "sales", "forecast"],
  operations: ["overview", "pos", "inventory", "suppliers"],
};

export const dashboardSectionLabels: Record<DashboardSection, string> = {
  overview: "Overview",
  pos: "Point of sale",
  sales: "Sales pulse",
  inventory: "Inventory health",
  suppliers: "Supplier network",
  forecast: "Predictive insight lab",
};

export const dashboardSectionDescriptions: Record<DashboardSection, string> = {
  overview: "Operational snapshot across retail, inventory, and supplier performance.",
  pos: "Record sales and stock receipts to keep the operational dataset in sync.",
  sales: "Revenue performance, category mix, and best-selling products.",
  inventory: "Live stock cover, reorder pressure, and restock priority.",
  suppliers: "Reliability, lead time, and fill-rate posture across the network.",
  forecast: "Predictive guidance on demand, stock-out risk, and seasonality.",
};

export type DashboardSnapshot = {
  dashboardSummary: {
    monthlyRevenue: number;
    monthlyRevenueChange: number;
    grossMargin: number;
    grossMarginChange: number;
    sellThroughRate: number;
    sellThroughRateChange: number;
    forecastAccuracy: number;
    forecastAccuracyChange: number;
    atRiskSkus: number;
    urgentSupplierIssues: number;
    liveSyncStatus: string;
  };
  salesPerformance: readonly {
    month: string;
    revenue: number;
    orders: number;
    margin: number;
    accessories: number;
    devices: number;
    services: number;
  }[];
  demandForecast: readonly {
    week: string;
    actual: number;
    forecast: number;
    phones: number;
    accessories: number;
    laptops: number;
  }[];
  inventoryHealth: readonly {
    sku: string;
    name: string;
    category: string;
    onHand: number;
    reorderPoint: number;
    weeklyVelocity: number;
    coverageWeeks: number;
    supplier: string;
    nextDelivery: string;
    status: "healthy" | "watch" | "critical";
  }[];
  topProducts: readonly {
    name: string;
    units: number;
    revenue: number;
    margin: number;
  }[];
  supplierSnapshots: readonly {
    name: string;
    reliability: number;
    leadDays: number;
    openOrders: number;
    fillRate: number;
    note: string;
  }[];
  alertFeed: readonly {
    title: string;
    detail: string;
    severity: "info" | "watch" | "critical";
  }[];
  recommendations: readonly {
    title: string;
    detail: string;
    impact: string;
  }[];
};
