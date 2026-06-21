"use client";

import { SVG } from "@mhaadi/svg/react";
import { useMemo } from "react";

import { cn } from "@_scaffold/ui/lib/utils";

const FALLBACK_PALETTE = [
  "oklch(0.72 0.13 35)",
  "oklch(0.7 0.12 75)",
  "oklch(0.68 0.13 145)",
  "oklch(0.7 0.12 200)",
  "oklch(0.65 0.15 270)",
  "oklch(0.65 0.15 320)",
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!source) return "·";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type AvatarProps = {
  seed: string;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
  rounded?: boolean;
};

export function Avatar({ seed, name, email, size = 28, className, rounded = true }: AvatarProps) {
  const initials = useMemo(() => getInitials(name, email), [name, email]);
  const fallbackColor = useMemo(
    () => FALLBACK_PALETTE[hashSeed(seed) % FALLBACK_PALETTE.length]!,
    [seed]
  );

  const url = `https://api.navii.dev/avatar/${encodeURIComponent(seed)}?size=${size * 2}`;

  return (
    <span
      aria-hidden={!name && !email}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-muted text-[10px] font-semibold uppercase text-foreground",
        rounded ? "rounded-full" : "rounded-md",
        className
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: fallbackColor, color: "white" }}
      >
        {initials}
      </span>
      <SVG
        src={url}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        fallback={null}
        loading={null}
      />
    </span>
  );
}
