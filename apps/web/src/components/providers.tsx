"use client";

import { useAuth } from "@clerk/nextjs";
import { env } from "@_scaffold/env/web";
import { TooltipProvider } from "@_scaffold/ui/components/tooltip";
import { Toaster } from "@_scaffold/ui/components/sonner";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convex = env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL)
  : null;
const clerkEnabled = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function Providers({ children }: { children: React.ReactNode }) {
  const content =
    convex && clerkEnabled ? (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    ) : convex ? (
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    ) : (
      children
    );

  return (
    <TooltipProvider>
      {content}
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
