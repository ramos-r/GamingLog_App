import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Star } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import type { LibraryEntry } from "shared";
import { apiFetch } from "../lib/api";
import { GameCover } from "./game-cover";
import { ManageFavoritesModal } from "./manage-favorites-modal";

export const FAVORITES_DROP_ID = "FAVORITES";

interface FavoritesRowProps {
  favorites: LibraryEntry[];
  onAddGame: () => void;
  onChanged: () => void;
}

export function FavoritesRow({ favorites, onAddGame, onChanged }: FavoritesRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const { setNodeRef, isOver } = useDroppable({ id: FAVORITES_DROP_ID });
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Favorites + the trailing "add a game" slot, treated as one looping sequence.
  const itemCount = favorites.length + 1;
  // Truncate stale refs from a previous, longer render so index math below
  // never reads a detached node's (always-zero) offsetLeft.
  useEffect(() => {
    itemRefs.current.length = itemCount;
  }, [itemCount]);

  function currentIndex(container: HTMLDivElement): number {
    for (let i = 0; i < itemRefs.current.length; i++) {
      const item = itemRefs.current[i];
      if (item && item.offsetLeft >= container.scrollLeft - 4) return i;
    }
    return itemCount - 1;
  }

  function scrollToIndex(index: number) {
    const wrapped = ((index % itemCount) + itemCount) % itemCount;
    itemRefs.current[wrapped]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function scrollNext() {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    scrollToIndex(atEnd ? 0 : currentIndex(el) + 1);
  }

  function scrollPrev() {
    const el = scrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    scrollToIndex(atStart ? itemCount - 1 : currentIndex(el) - 1);
  }

  async function handleUnfavorite(entryId: string) {
    await apiFetch(`/library/${entryId}`, { method: "PATCH", body: JSON.stringify({ isFavorite: false }) });
    onChanged();
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Favorites</h2>
        {favorites.length > 0 && (
          <button
            type="button"
            onClick={() => setIsManageOpen(true)}
            aria-label="Manage favorites"
            className="rounded-full p-1 text-muted transition-colors hover:text-text"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>
      <div ref={setNodeRef} className={`relative rounded-lg bg-surface p-4 transition-colors ${isOver ? "bg-surface-raised/60" : ""}`}>
        <div ref={scrollRef} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth">
          {favorites.map((entry, index) => (
            <div
              key={entry.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="group relative shrink-0"
            >
              <GameCover coverUrl={entry.game.coverUrl} title={entry.game.title} className="w-24 sm:w-28" />
              <button
                type="button"
                onClick={() => void handleUnfavorite(entry.id)}
                aria-label={`Remove ${entry.game.title} from favorites`}
                className="absolute right-1 top-1 rounded-full bg-background/60 p-1 text-accent-light opacity-0 transition group-hover:opacity-100 hover:scale-110 hover:text-muted"
              >
                <Star className="h-4 w-4 fill-current hover:fill-none" />
              </button>
            </div>
          ))}
          <button
            ref={(el) => {
              itemRefs.current[favorites.length] = el;
            }}
            type="button"
            onClick={onAddGame}
            aria-label="Add a game to your favorites"
            className="flex aspect-3/4 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-subtle text-muted transition-colors hover:text-text sm:w-28"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        {itemCount > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous favorite"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface-raised p-2 text-text transition-colors hover:text-accent-light sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next favorite"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-surface-raised p-2 text-text transition-colors hover:text-accent-light sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <ManageFavoritesModal
        open={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        favorites={favorites}
        onChanged={onChanged}
      />
    </section>
  );
}
