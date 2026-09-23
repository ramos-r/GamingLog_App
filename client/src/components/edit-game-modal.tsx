import { useState, type FormEvent } from "react";
import type { Category, LibraryEntry } from "shared";
import { apiFetch, ApiError } from "../lib/api";
import { PLATFORM_OPTIONS } from "../lib/platforms";
import { Modal } from "./modal";
import { GameCover } from "./game-cover";
import { StarRatingInput } from "./star-rating-input";
import { PlatformSelect } from "./platform-select";
import { CategorySelect } from "./category-select";

interface EditGameModalProps {
  open: boolean;
  onClose: () => void;
  entry: LibraryEntry;
  onChanged: () => void;
}

export function EditGameModal({ open, onClose, entry, onChanged }: EditGameModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      {/* Mounted only while open, so its form state starts fresh each time. */}
      {open && <EditGameForm entry={entry} onChanged={onChanged} onClose={onClose} />}
    </Modal>
  );
}

interface EditGameFormProps {
  entry: LibraryEntry;
  onChanged: () => void;
  onClose: () => void;
}

function EditGameForm({ entry, onChanged, onClose }: EditGameFormProps) {
  const isKnownPlatform = entry.platform !== null && (PLATFORM_OPTIONS as string[]).includes(entry.platform);

  const [category, setCategory] = useState<Category>(entry.category);
  const [platform, setPlatform] = useState(isKnownPlatform ? entry.platform! : entry.platform ? "Other" : PLATFORM_OPTIONS[0]);
  const [customPlatform, setCustomPlatform] = useState(isKnownPlatform ? "" : (entry.platform ?? ""));
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [isFavorite, setIsFavorite] = useState(entry.isFavorite);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/library/${entry.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          category,
          platform: platform === "Other" ? customPlatform || undefined : platform,
          rating: rating ?? undefined,
          isFavorite,
        }),
      });
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setIsRemoving(true);
    try {
      await apiFetch(`/library/${entry.id}`, { method: "DELETE" });
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setIsRemoving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <GameCover coverUrl={entry.game.coverUrl} title={entry.game.title} className="w-14 shrink-0" />
        <h2 className="font-baloo text-lg font-bold">{entry.game.title}</h2>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Category
        <CategorySelect value={category} onChange={setCategory} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Platform
        <PlatformSelect value={platform} onChange={setPlatform} />
      </label>
      {platform === "Other" && (
        <input
          className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
          placeholder="Platform name"
          value={customPlatform}
          onChange={(e) => setCustomPlatform(e.target.value)}
        />
      )}

      <div className="flex flex-col gap-1 text-sm">
        Rating
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFavorite} onChange={(e) => setIsFavorite(e.target.checked)} />
        Mark as favorite
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold text-accent-foreground disabled:opacity-50"
        >
          Save changes
        </button>
      </div>

      <hr className="my-1 border-subtle" />

      {isConfirmingRemove ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text">Remove &quot;{entry.game.title}&quot; from your library?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(false)}
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
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirmingRemove(true)}
          className="self-start text-sm font-medium text-destructive"
        >
          Remove from my library
        </button>
      )}
    </form>
  );
}
