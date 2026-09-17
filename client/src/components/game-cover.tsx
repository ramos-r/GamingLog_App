import { Gamepad2 } from "lucide-react";
import { PlatformBadge } from "./platform-badge";

interface GameCoverProps {
  coverUrl: string | null;
  title: string;
  platform?: string | null;
  className?: string;
}

export function GameCover({ coverUrl, title, platform, className }: GameCoverProps) {
  return (
    <div className={`relative aspect-3/4 overflow-hidden rounded-lg bg-surface-raised ${className ?? ""}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" role="img" aria-label={title}>
          <Gamepad2 className="h-8 w-8 text-muted" aria-hidden="true" />
        </div>
      )}
      {platform && <PlatformBadge platform={platform} className="absolute bottom-1 right-1" />}
    </div>
  );
}
