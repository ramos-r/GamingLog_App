import { useState } from "react";
import type { LibraryEntry } from "shared";
import { GameCover } from "./game-cover";
import { StarRating } from "./star-rating";
import { PlatformBadge } from "./platform-badge";
import { EditGameModal } from "./edit-game-modal";
import { RemoveGameModal } from "./remove-game-modal";
import { GameCardMenu } from "./game-card-menu";

interface GameCardProps {
  entry: LibraryEntry;
  onChanged: () => void;
  categoryLabel?: string;
}

export function GameCard({ entry, onChanged, categoryLabel }: GameCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  return (
    <div className="relative flex gap-3 rounded-lg bg-surface p-3">
      <GameCover coverUrl={entry.game.coverUrl} title={entry.game.title} className="w-16 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="break-words pr-6 font-baloo text-sm font-medium">{entry.game.title}</p>
          {categoryLabel && <p className="mt-0.5 text-xs text-muted">{categoryLabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={entry.rating} />
          <PlatformBadge platform={entry.platform} />
        </div>
      </div>

      <GameCardMenu
        title={entry.game.title}
        onEdit={() => setIsEditOpen(true)}
        onRemove={() => setIsRemoveOpen(true)}
      />

      <EditGameModal open={isEditOpen} onClose={() => setIsEditOpen(false)} entry={entry} onChanged={onChanged} />
      <RemoveGameModal open={isRemoveOpen} onClose={() => setIsRemoveOpen(false)} entry={entry} onRemoved={onChanged} />
    </div>
  );
}
