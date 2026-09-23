import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface GameCardMenuProps {
  title: string;
  onEdit: () => void;
  onRemove: () => void;
}

export function GameCardMenu({ title, onEdit, onRemove }: GameCardMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Options for ${title}`}
          className="absolute right-2 top-2 rounded-full p-1 text-muted transition-colors hover:text-text"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="input-surface z-50 w-36 overflow-hidden rounded-lg border border-subtle shadow-xl"
        >
          <DropdownMenu.Item
            onSelect={onEdit}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-raised"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onRemove}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-destructive outline-none data-[highlighted]:bg-surface-raised"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
