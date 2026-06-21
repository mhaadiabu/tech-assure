import { BarColumn, DonutRing, SparklinePath } from "./visuals";

type Props = {
  className?: string;
};

const trend: readonly number[] = [12, 18, 14, 22, 19, 26, 24, 30, 28, 34, 32, 38];
const trend2: readonly number[] = [8, 10, 9, 12, 11, 14, 13, 15, 14, 16, 15, 18];

export function DashboardPreview({ className }: Props) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] " +
        (className ?? "")
      }
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1 text-[10px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[color:var(--accent-warm)] animate-pulse-slow" />
          techassure / overview
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">v2.4</span>
      </div>

      <div className="grid grid-cols-[140px_1fr]">
        <aside className="border-r border-border bg-muted/30 px-3 py-4">
          <div className="mb-4 flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded bg-foreground text-background">
              <span className="font-mono text-[9px] font-bold">/</span>
            </div>
            <span className="text-[11px] font-semibold tracking-tight">TechAssure</span>
          </div>
          <ul className="flex flex-col gap-0.5 text-[11px]">
            {[
              { label: "Overview", active: true, dot: "bg-[color:var(--accent-warm)]" },
              { label: "Point of sale", active: false },
              { label: "Sales", active: false },
              { label: "Inventory", active: false },
              { label: "Suppliers", active: false },
              { label: "Forecast", active: false },
            ].map((item) => (
              <li
                key={item.label}
                className={
                  "flex items-center gap-2 rounded-md px-2 py-1.5 " +
                  (item.active
                    ? "bg-background font-medium text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                    : "text-muted-foreground")
                }
              >
                {item.dot ? (
                  <span className={`size-1.5 rounded-full ${item.dot}`} />
                ) : (
                  <span className="size-1.5 rounded-full bg-border" />
                )}
                {item.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-md border border-border bg-background px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Role</div>
            <div className="text-[11px] font-semibold">Manager</div>
          </div>
        </aside>

        <div className="px-4 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                This month
              </div>
              <div className="mt-1 h-5 w-28 rounded bg-muted" />
            </div>
            <span className="size-4 rounded-full border border-[color:var(--accent-warm)]/40" />
          </div>

          <div className="mb-4 h-12">
            <SparklinePath
              values={trend}
              width={400}
              height={48}
              stroke="var(--accent-warm)"
              fill
              fillColor="var(--accent-warm)"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-border bg-background px-2.5 py-2">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground">
                At-risk SKUs
              </div>
              <div className="mt-1 h-3 w-10 rounded bg-muted" />
              <div className="mt-2 h-4">
                <BarColumn
                  values={[6, 4, 8, 3, 7, 5, 9, 4, 6, 8, 5, 7]}
                  width={80}
                  height={16}
                  fill="var(--accent-warm)"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            <div className="rounded-md border border-border bg-background px-2.5 py-2">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground">
                Forecast acc.
              </div>
              <div className="mt-1 h-3 w-10 rounded bg-muted" />
              <div className="mt-2 h-4">
                <SparklinePath
                  values={trend2}
                  width={80}
                  height={16}
                  stroke="var(--foreground)"
                  strokeWidth={1}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            <div className="flex items-center justify-center rounded-md border border-border bg-background px-2 py-2">
              <DonutRing value={0.7} size={40} stroke={4} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex flex-col gap-1 rounded-md border border-border bg-background px-2 py-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Fastest supplier</span>
                <span className="h-2 w-6 rounded bg-muted" />
              </div>
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
            <div className="flex flex-col gap-1 rounded-md border border-border bg-background px-2 py-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Lowest cover</span>
                <span className="h-2 w-6 rounded bg-muted" />
              </div>
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
