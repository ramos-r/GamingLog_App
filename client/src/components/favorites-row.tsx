import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import type { LibraryEntry } from "shared";
import { GameCover } from "./game-cover";

interface FavoritesRowProps {
  favorites: LibraryEntry[];
}

export function FavoritesRow({ favorites }: FavoritesRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollNext() {
    scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Favorites</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted">No favorites yet — star a game from your library to feature it here.</p>
      ) : (
        <div className="relative rounded-lg bg-surface p-4">
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth">
            {favorites.map((entry) => (
              <GameCover
                key={entry.id}
                coverUrl={entry.game.coverUrl}
                title={entry.game.title}
                className="w-24 shrink-0 sm:w-28"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Show more favorites"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface-raised p-2 text-text transition-colors hover:text-accent-light sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
