import { siSteam, siPlaystation, siDiscord, siEpicgames, siBattledotnet, siTwitch } from "simple-icons";
import { Gamepad2 } from "lucide-react";
import { XboxIcon } from "./xbox-icon";

interface SocialPlatformIconProps {
  platform: string;
  className?: string;
}

function BrandIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// Icon per social platform, per PLAN.md Phase 13 §14.5:
// - Steam/PlayStation/Discord/Epic/Battle.net/Twitch: simple-icons (CC0).
// - Xbox: simple-icons has no mark for it — reuse the bundled Phase 1 glyph.
// - Nintendo: no adequate mark in lucide-react or simple-icons — falls back
//   to the generic icon, visibly muted so it doesn't read as intentional.
// - Other / anything unrecognized: the same generic fallback, unmuted.
export function SocialPlatformIcon({ platform, className = "h-4 w-4" }: SocialPlatformIconProps) {
  switch (platform) {
    case "Steam":
      return <BrandIcon path={siSteam.path} className={className} />;
    case "PlayStation":
      return <BrandIcon path={siPlaystation.path} className={className} />;
    case "Discord":
      return <BrandIcon path={siDiscord.path} className={className} />;
    case "Epic":
      return <BrandIcon path={siEpicgames.path} className={className} />;
    case "Battle.net":
      return <BrandIcon path={siBattledotnet.path} className={className} />;
    case "Twitch":
      return <BrandIcon path={siTwitch.path} className={className} />;
    case "Xbox":
      return <XboxIcon className={className} />;
    case "Nintendo":
      return <Gamepad2 className={`${className} opacity-50`} aria-hidden="true" />;
    default:
      return <Gamepad2 className={className} aria-hidden="true" />;
  }
}
