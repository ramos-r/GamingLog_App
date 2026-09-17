import type { LibraryEntry } from "shared";
import { GameCard } from "./game-card";

interface CategorySectionProps {
  title: string;
  entries: LibraryEntry[];
  emptyMessage: string;
}

export function CategorySection({ title, entries, emptyMessage }: CategorySectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) => (
            <GameCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
