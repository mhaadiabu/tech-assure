"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "next-themes";

import { BrandMark } from "@/components/brand-mark";
import { ModeToggle } from "@/components/mode-toggle";
import { clerkAppearanceLight, clerkAppearanceDark } from "@/lib/clerk-appearance";

export default function SignInPage() {
  const { resolvedTheme } = useTheme();
  const appearance = resolvedTheme === "dark" ? clerkAppearanceDark : clerkAppearanceLight;

  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between border-b border-border/80 px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark size={28} className="h-7 w-7 transition-opacity group-hover:opacity-80" />
          <span className="font-display text-xl leading-none">TechAssure</span>
        </Link>
        <ModeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-4xl leading-none tracking-tight">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your TechAssure workspace.
            </p>
          </div>

          <div className="border border-border bg-card p-6">
            <SignIn appearance={appearance} routing="hash" />
          </div>
        </div>
      </main>
    </div>
  );
}
