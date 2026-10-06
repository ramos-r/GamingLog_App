import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LibraryEntry } from "shared";
import { GameCard } from "./game-card";

interface SortableGameCardProps {
  entry: LibraryEntry;
  onChanged?: () => void;
}

// A card that can be dragged to another category or into a new place within
// its own.
export function SortableGameCard({ entry, onChanged }: SortableGameCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
      {...listeners}
      {...attributes}
    >
      <GameCard entry={entry} onChanged={onChanged} />
    </div>
  );
}
