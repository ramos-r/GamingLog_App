import { useDroppable } from "@dnd-kit/core";
import type { Category, LibraryEntry } from "shared";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { GameCard } from "./game-card";
import { SortableGameCard } from "./sortable-game-card";

interface CategorySectionProps {
  category: Category;
  title: string;
  entries: LibraryEntry[];
  emptyMessage: string;
  onAddGame?: () => void;
  onChanged?: () => void;
  // Someone else's profile: not a drop target or sortable, plain cards, no
  // add button.
  readOnly?: boolean;
}

export function CategorySection({
  category,
  title,
  entries,
  emptyMessage,
  onAddGame,
  onChanged,
  readOnly = false,
}: CategorySectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: category, disabled: readOnly });

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div ref={setNodeRef} className={`rounded-lg p-1 transition-colors ${isOver ? "bg-surface-raised/60" : ""}`}>
        {entries.length === 0 ? (
          readOnly ? (
            <p className="text-sm text-muted">{emptyMessage}</p>
          ) : (
            <button
              type="button"
              onClick={onAddGame}
              className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-subtle text-sm text-muted transition-colors hover:text-text hover:underline"
            >
              {emptyMessage}
            </button>
          )
        ) : (
          <SortableContext items={entries.map((entry) => entry.id)} strategy={rectSortingStrategy} disabled={readOnly}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {entries.map((entry) =>
                readOnly ? (
                  <GameCard key={entry.id} entry={entry} readOnly />
                ) : (
                  <SortableGameCard key={entry.id} entry={entry} onChanged={onChanged} />
                ),
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </section>
  );
}
