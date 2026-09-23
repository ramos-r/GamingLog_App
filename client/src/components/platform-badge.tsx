import { Gamepad2 } from "lucide-react";
import { XboxIcon } from "./xbox-icon";

interface PlatformBadgeProps {
  platform: string | null;
  className?: string;
}

// Simple, original glyphs that evoke each platform without reproducing any
// brand's actual logo artwork — CLAUDE.md calls for "a small bundled SVG
// set", not a copy of trademarked marks.
function PcIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
      <rect x="2" y="2" width="9" height="9" />
      <rect x="13" y="2" width="9" height="9" />
      <rect x="2" y="13" width="9" height="9" />
      <rect x="13" y="13" width="9" height="9" />
    </svg>
  );
}

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <circle cx="9" cy="9" r="4" />
      <circle cx="16" cy="16" r="3" />
      <line x1="11.5" y1="11.5" x2="13.5" y2="13.5" />
    </svg>
  );
}

function PlayStationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <polygon points="12,3 15,8 9,8" />
      <circle cx="19" cy="12" r="2.3" />
      <rect x="3" y="9.5" width="5" height="5" />
      <rect x="9.8" y="16.8" width="4.5" height="4.5" transform="rotate(45 12 19)" />
    </svg>
  );
}

function normalize(platform: string): "pc" | "steam" | "xbox" | "playstation" | null {
  const value = platform.toLowerCase();
  if (value.includes("steam")) return "steam";
  if (value.includes("xbox")) return "xbox";
  if (value.includes("play") || value.includes("ps4") || value.includes("ps5")) return "playstation";
  if (value.includes("pc") || value.includes("windows")) return "pc";
  return null;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  if (!platform) return null;

  const kind = normalize(platform);
  const icon =
    kind === "steam" ? (
      <SteamIcon />
    ) : kind === "xbox" ? (
      <XboxIcon />
    ) : kind === "playstation" ? (
      <PlayStationIcon />
    ) : kind === "pc" ? (
      <PcIcon />
    ) : (
      <Gamepad2 className="h-3 w-3" />
    );

  return (
    <div
      className={`flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised text-text ${className ?? ""}`}
      title={platform}
      aria-hidden="true"
    >
      {icon}
    </div>
  );
}
