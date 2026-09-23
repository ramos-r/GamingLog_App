import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SocialLink } from "shared";
import { apiFetch } from "../lib/api";
import { SocialPlatformIcon } from "./social-platform-icon";

interface SortableSocialLinksProps {
  links: SocialLink[];
  onReorder: (links: SocialLink[]) => void;
}

export function SortableSocialLinks({ links, onReorder }: SortableSocialLinksProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousLinks = links;
    const reordered = arrayMove(links, oldIndex, newIndex);
    onReorder(reordered);

    try {
      await apiFetch("/users/me/social-links/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: reordered.map((link) => link.id) }),
      });
    } catch {
      onReorder(previousLinks);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={(event) => void handleDragEnd(event)}>
      <SortableContext items={links.map((link) => link.id)} strategy={rectSortingStrategy}>
        <ul className="mt-3 flex flex-wrap gap-3">
          {links.map((link) => (
            <SortableChip key={link.id} link={link} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface SortableChipProps {
  link: SocialLink;
}

function SortableChip({ link }: SortableChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab items-center gap-1.5 rounded-full px-1 text-xs text-muted outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      <SocialPlatformIcon platform={link.platform} className="h-4 w-4 shrink-0" />
      {link.handle}
    </li>
  );
}
