import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CatalogGame, Category, IgdbSuggestion } from "shared";
import { apiFetch, ApiError } from "../lib/api";
import { uploadFile } from "../lib/upload";
import { PLATFORM_OPTIONS } from "../lib/platforms";
import { Modal } from "./modal";
import { GameCover } from "./game-cover";
import { StarRatingInput } from "./star-rating-input";
import { PlatformSelect } from "./platform-select";
import { CategorySelect } from "./category-select";

type Step =
  | { kind: "search" }
  | { kind: "manual"; prefill?: { title: string; genre: string; coverUrl: string } }
  | { kind: "details"; game: CatalogGame };

interface AddGameModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddGameModal({ open, onClose, onAdded }: AddGameModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      {/* Mounted only while open, so its state starts fresh every time
          instead of needing an effect to reset it on close. */}
      {open && <AddGameFlow onClose={onClose} onAdded={onAdded} />}
    </Modal>
  );
}

interface AddGameFlowProps {
  onClose: () => void;
  onAdded: () => void;
}

function AddGameFlow({ onClose, onAdded }: AddGameFlowProps) {
  const [step, setStep] = useState<Step>({ kind: "search" });
  const [query, setQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogGame[]>([]);
  const [igdbSuggestions, setIgdbSuggestions] = useState<IgdbSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (step.kind !== "search") return;

    const timeout = setTimeout(() => {
      setIsSearching(true);
      apiFetch<CatalogGame[]>(`/catalog?search=${encodeURIComponent(query)}`)
        .then(async (games) => {
          setCatalogResults(games);
          if (games.length === 0 && query.trim()) {
            const suggestions = await apiFetch<IgdbSuggestion[]>(`/catalog/external-search?q=${encodeURIComponent(query)}`);
            setIgdbSuggestions(suggestions);
          } else {
            setIgdbSuggestions([]);
          }
        })
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, step.kind]);

  return (
    <>
      {step.kind === "search" && (
        <SearchStep
          query={query}
          onQueryChange={setQuery}
          results={catalogResults}
          suggestions={igdbSuggestions}
          isSearching={isSearching}
          onSelectGame={(game) => setStep({ kind: "details", game })}
          onSelectSuggestion={(suggestion) =>
            setStep({
              kind: "manual",
              prefill: { title: suggestion.title, genre: suggestion.genre ?? "", coverUrl: suggestion.coverUrl ?? "" },
            })
          }
          onAddManually={() => setStep({ kind: "manual" })}
        />
      )}

      {step.kind === "manual" && (
        <ManualFormStep
          prefill={step.prefill}
          onCreated={(game) => setStep({ kind: "details", game })}
          onUseExisting={(game) => setStep({ kind: "details", game })}
          onCancel={() => setStep({ kind: "search" })}
        />
      )}

      {step.kind === "details" && (
        <DetailsStep
          game={step.game}
          onDone={() => {
            onAdded();
            onClose();
          }}
          onCancel={onClose}
        />
      )}
    </>
  );
}

interface SearchStepProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: CatalogGame[];
  suggestions: IgdbSuggestion[];
  isSearching: boolean;
  onSelectGame: (game: CatalogGame) => void;
  onSelectSuggestion: (suggestion: IgdbSuggestion) => void;
  onAddManually: () => void;
}

function SearchStep({
  query,
  onQueryChange,
  results,
  suggestions,
  isSearching,
  onSelectGame,
  onSelectSuggestion,
  onAddManually,
}: SearchStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showIgdbFallback = query.trim().length > 0 && results.length === 0 && !isSearching;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-baloo text-lg font-bold">Add a game</h2>
      <input
        ref={inputRef}
        className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
        placeholder="Search for a game"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      {results.length > 0 && (
        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {results.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => onSelectGame(game)}
                className="flex w-full items-center gap-3 rounded-lg bg-surface-raised p-2 text-left transition-colors hover:bg-subtle"
              >
                <GameCover coverUrl={game.coverUrl} title={game.title} className="w-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-baloo text-sm font-medium">{game.title}</span>
                  {game.genre && <span className="block truncate text-xs text-muted">{game.genre}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showIgdbFallback && (
        <div className="flex flex-col gap-2">
          {suggestions.length > 0 && (
            <>
              <p className="text-xs text-muted">Suggestions</p>
              <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onSelectSuggestion(suggestion)}
                      className="flex w-full items-center gap-3 rounded-lg bg-surface-raised p-2 text-left transition-colors hover:bg-subtle"
                    >
                      <GameCover coverUrl={suggestion.coverUrl} title={suggestion.title} className="w-10 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-baloo text-sm font-medium">{suggestion.title}</span>
                        {suggestion.platforms.length > 0 && (
                          <span className="block truncate text-xs text-muted">{suggestion.platforms.join(", ")}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">Game data &amp; covers via IGDB.com</p>
            </>
          )}
          <button
            type="button"
            onClick={onAddManually}
            className="rounded-full border border-subtle py-2 font-baloo text-sm font-bold text-muted transition-colors hover:text-text"
          >
            Can&apos;t find it? Add it manually
          </button>
        </div>
      )}
    </div>
  );
}

interface ManualFormStepProps {
  prefill?: { title: string; genre: string; coverUrl: string };
  onCreated: (game: CatalogGame) => void;
  onUseExisting: (game: CatalogGame) => void;
  onCancel: () => void;
}

function ManualFormStep({ prefill, onCreated, onUseExisting, onCancel }: ManualFormStepProps) {
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [genre, setGenre] = useState(prefill?.genre ?? "");
  const [coverUrl, setCoverUrl] = useState(prefill?.coverUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<CatalogGame | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDuplicate(null);
    setIsSubmitting(true);
    try {
      const game = await apiFetch<CatalogGame>("/catalog", {
        method: "POST",
        body: JSON.stringify({ title, genre: genre || undefined, coverUrl: coverUrl || undefined }),
      });
      onCreated(game);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // The server includes the existing match on a 409 — apiFetch only
        // surfaces the message, so re-fetch the raw body for the game itself.
        const res = await fetch(`/api/catalog?search=${encodeURIComponent(title)}`, { credentials: "include" });
        const matches = (await res.json()) as CatalogGame[];
        const existing = matches.find((g) => g.title.toLowerCase() === title.toLowerCase());
        if (existing) {
          setDuplicate(existing);
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (duplicate) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-baloo text-lg font-bold">Already in the catalog</h2>
        <p className="text-sm text-muted">A game called &quot;{duplicate.title}&quot; already exists.</p>
        <button
          type="button"
          onClick={() => onUseExisting(duplicate)}
          className="rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold text-accent-foreground"
        >
          Use this one instead
        </button>
        <button type="button" onClick={() => setDuplicate(null)} className="text-xs text-muted hover:text-text">
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-baloo text-lg font-bold">Add a new game</h2>
      <input
        className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
        placeholder="Genre (optional)"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      />
      <input
        className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
        placeholder="Cover URL (optional)"
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
      />
      <label className="text-xs text-muted">
        Or upload a cover
        <input type="file" accept="image/*" onChange={(e) => void handleUpload(e)} className="mt-1 block text-xs" />
      </label>
      {isUploading && <p className="text-xs text-muted">Uploading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold text-accent-foreground disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

interface DetailsStepProps {
  game: CatalogGame;
  onDone: () => void;
  onCancel: () => void;
}

function DetailsStep({ game, onDone, onCancel }: DetailsStepProps) {
  const [category, setCategory] = useState<Category>("PLAYING");
  const [platform, setPlatform] = useState(PLATFORM_OPTIONS[0]);
  const [customPlatform, setCustomPlatform] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch("/library", {
        method: "POST",
        body: JSON.stringify({
          gameId: game.id,
          category,
          platform: platform === "Other" ? customPlatform || undefined : platform,
          rating: rating ?? undefined,
          isFavorite,
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <GameCover coverUrl={game.coverUrl} title={game.title} className="w-14 shrink-0" />
        <h2 className="font-baloo text-lg font-bold">{game.title}</h2>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Category
        <CategorySelect value={category} onChange={setCategory} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Platform (optional)
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
        Rating (optional)
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
          onClick={onCancel}
          className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold text-accent-foreground disabled:opacity-50"
        >
          Add to library
        </button>
      </div>
    </form>
  );
}
