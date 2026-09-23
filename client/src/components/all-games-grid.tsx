import type { LibraryResponse } from "shared";
import { CATEGORY_LABELS } from "../lib/categories";
import { GameCard } from "./game-card";

interface AllGamesGridProps {
  library: LibraryResponse;
  onChanged: () => void;
}

export function AllGamesGrid({ library, onChanged }: AllGamesGridProps) {
  const allEntries = [...library.playing, ...library.playedBefore, ...library.wantToPlay];

  if (allEntries.length === 0) {
    return <p className="text-sm text-muted">No games in your library yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {allEntries.map((entry) => (
        <GameCard key={entry.id} entry={entry} onChanged={onChanged} categoryLabel={CATEGORY_LABELS[entry.category]} />
      ))}
    </div>
  );
}
