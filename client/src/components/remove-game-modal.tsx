import { useState } from "react";
import type { LibraryEntry } from "shared";
import { apiFetch, ApiError } from "../lib/api";
import { Modal } from "./modal";

interface RemoveGameModalProps {
  open: boolean;
  onClose: () => void;
  entry: LibraryEntry;
  onRemoved: () => void;
}

export function RemoveGameModal({ open, onClose, entry, onRemoved }: RemoveGameModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      {open && <RemoveGameConfirm entry={entry} onClose={onClose} onRemoved={onRemoved} />}
    </Modal>
  );
}

interface RemoveGameConfirmProps {
  entry: LibraryEntry;
  onClose: () => void;
  onRemoved: () => void;
}

function RemoveGameConfirm({ entry, onClose, onRemoved }: RemoveGameConfirmProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setError(null);
    setIsRemoving(true);
    try {
      await apiFetch(`/library/${entry.id}`, { method: "DELETE" });
      onRemoved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setIsRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-baloo text-lg font-bold">Remove from library</h2>
      <p className="text-sm text-text">Remove &quot;{entry.game.title}&quot; from your library?</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleRemove()}
          disabled={isRemoving}
          className="flex-1 rounded-full bg-destructive py-2.5 font-baloo text-sm font-bold text-white disabled:opacity-50"
        >
          Yes, remove
        </button>
      </div>
    </div>
  );
}
