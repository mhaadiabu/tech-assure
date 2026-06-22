"use client";

import { Button } from "@tech-assure/ui/components/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof THEMES)[number];

const ThemeIcon: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = (theme as Theme) ?? "system";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const activeTheme = mounted
    ? current === "system"
      ? ((resolvedTheme as Theme) ?? "light")
      : current
    : "light";
  const Icon = ThemeIcon[activeTheme];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
    >
      <Icon className="size-4" suppressHydrationWarning />
      <span className="sr-only">Switch to {next} mode</span>
    </Button>
  );
}
