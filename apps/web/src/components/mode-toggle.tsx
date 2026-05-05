"use client";

import { Button } from "@_scaffold/ui/components/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof THEMES)[number];

const ThemeIcon: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const current = (theme as Theme) ?? "system";
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const Icon = ThemeIcon[current === "system" ? ((resolvedTheme as Theme) ?? "light") : current];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
    >
      <Icon className="size-4" />
      <span className="sr-only">Switch to {next} mode</span>
    </Button>
  );
}
