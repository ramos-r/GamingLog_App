import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { LibraryEntry } from "shared";
import { GameCard } from "./game-card";

interface DraggableGameCardProps {
  entry: LibraryEntry;
  onChanged?: () => void;
}

export function DraggableGameCard({ entry, onChanged }: DraggableGameCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: entry.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? "opacity-40" : ""}
      {...listeners}
      {...attributes}
    >
      <GameCard entry={entry} onChanged={onChanged} />
    </div>
  );
}
