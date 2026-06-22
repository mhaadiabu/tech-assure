import type { Route } from "next";
import Link from "next/link";

import { Button } from "@tech-assure/ui/components/button";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <span className="font-display text-6xl leading-none tracking-tight">404</span>
      <h1 className="font-display text-2xl">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for has moved or never existed. Head back to the overview to
        find your way.
      </p>
      <div className="flex gap-2 pt-2">
        <Button nativeButton={false} render={<Link href={"/" as Route} />}>
          Back to overview
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href={"/dashboard" as Route} />}>
          Open dashboard
        </Button>
      </div>
    </div>
  );
}
