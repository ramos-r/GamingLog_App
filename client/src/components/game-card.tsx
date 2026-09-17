import type { LibraryEntry } from "shared";
import { GameCover } from "./game-cover";
import { StarRating } from "./star-rating";

interface GameCardProps {
  entry: LibraryEntry;
}

export function GameCard({ entry }: GameCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
      <GameCover coverUrl={entry.game.coverUrl} title={entry.game.title} platform={entry.platform} className="w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-baloo text-sm font-medium">{entry.game.title}</p>
        <StarRating rating={entry.rating} className="mt-1.5" />
      </div>
    </div>
  );
}
