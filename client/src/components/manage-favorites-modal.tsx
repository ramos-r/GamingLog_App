import { useState } from "react";
import { Plus, Star } from "lucide-react";
import type { LibraryEntry } from "shared";
import { apiFetch, ApiError } from "../lib/api";
import { Modal } from "./modal";
import { GameCover } from "./game-cover";
import { AddGameModal } from "./add-game-modal";

interface ManageFavoritesModalProps {
  open: boolean;
  onClose: () => void;
  favorites: LibraryEntry[];
  onChanged: () => void;
}

export function ManageFavoritesModal({ open, onClose, favorites, onChanged }: ManageFavoritesModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      {/* Mounted only while open, so its state starts fresh each time. */}
      {open && <ManageFavoritesList favorites={favorites} onChanged={onChanged} onClose={onClose} />}
    </Modal>
  );
}

interface ManageFavoritesListProps {
  favorites: LibraryEntry[];
  onChanged: () => void;
  onClose: () => void;
}

function ManageFavoritesList({ favorites, onChanged, onClose }: ManageFavoritesListProps) {
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);

  async function handleUnfavorite(entryId: string) {
    setError(null);
    setRemovingIds((prev) => [...prev, entryId]);
    try {
      await apiFetch(`/library/${entryId}`, { method: "PATCH", body: JSON.stringify({ isFavorite: false }) });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setRemovingIds((prev) => prev.filter((id) => id !== entryId));
    }
  }

  const visibleFavorites = favorites.filter((entry) => !removingIds.includes(entry.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-baloo text-lg font-bold">Manage favorites</h2>
        <button
          type="button"
          onClick={() => setIsAddGameOpen(true)}
          aria-label="Add a game to your favorites"
          className="rounded-full p-1 text-muted transition-colors hover:text-text"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {visibleFavorites.length === 0 ? (
        <p className="text-sm text-muted">No favorites yet.</p>
      ) : (
        <ul className="no-scrollbar flex max-h-80 flex-col gap-2 overflow-y-auto">
          {visibleFavorites.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 rounded-lg bg-surface-raised p-2">
              <GameCover coverUrl={entry.game.coverUrl} title={entry.game.title} className="w-10 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-baloo text-sm font-medium">{entry.game.title}</span>
              <button
                type="button"
                onClick={() => void handleUnfavorite(entry.id)}
                aria-label={`Remove ${entry.game.title} from favorites`}
                className="shrink-0 p-1 text-accent-light transition hover:scale-110 hover:text-muted"
              >
                <Star className="h-5 w-5 fill-current hover:fill-none" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted transition-colors hover:text-text"
      >
        Done
      </button>

      <AddGameModal open={isAddGameOpen} onClose={() => setIsAddGameOpen(false)} onAdded={onChanged} />
    </div>
  );
}
