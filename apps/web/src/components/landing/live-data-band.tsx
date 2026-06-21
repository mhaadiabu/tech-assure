"use client";

import { useEffect, useState } from "react";

const CURRENCY = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

type Props = {
  monthlyRevenue: number | null;
  atRiskSkus: number | null;
  forecastAccuracy: number | null;
  criticalAlerts: number | null;
  fastestSupplier: string | null;
  topRevenueSku: string | null;
};

export function LiveDataBand(props: Props) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      setNow(`${hh}:${mm}:${ss} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-[color:var(--accent-warm)] text-[color:var(--accent-warm-foreground)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.18) 14px 15px)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-75">
            <span className="size-1.5 rounded-full bg-[color:var(--accent-warm-foreground)] animate-pulse-slow" />
            Live · {now || "—"}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-65">Month to date</div>
          <div className="font-display text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {props.monthlyRevenue != null ? CURRENCY.format(props.monthlyRevenue) : "—"}
          </div>
          <div className="text-sm opacity-75">Revenue across all stores</div>
        </div>

        <div className="flex flex-col gap-1 border-l border-[color:var(--accent-warm-foreground)]/20 pl-5">
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-65">At-risk SKUs</div>
          <div className="text-2xl font-semibold tabular-nums">
            {props.atRiskSkus != null ? props.atRiskSkus : "—"}
          </div>
          <div className="text-xs opacity-75">Below reorder point</div>
        </div>
        <div className="flex flex-col gap-1 border-l border-[color:var(--accent-warm-foreground)]/20 pl-5">
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-65">Forecast accuracy</div>
          <div className="text-2xl font-semibold tabular-nums">
            {props.forecastAccuracy != null
              ? `${(props.forecastAccuracy * 100).toFixed(1)}%`
              : "—"}
          </div>
          <div className="text-xs opacity-75">Last 4 weeks</div>
        </div>
        <div className="flex flex-col gap-1 border-l border-[color:var(--accent-warm-foreground)]/20 pl-5">
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-65">Critical alerts</div>
          <div className="text-2xl font-semibold tabular-nums">
            {props.criticalAlerts != null ? props.criticalAlerts : "—"}
          </div>
          <div className="text-xs opacity-75">
            Top: {props.topRevenueSku ?? "—"}
          </div>
        </div>
      </div>
    </section>
  );
}
