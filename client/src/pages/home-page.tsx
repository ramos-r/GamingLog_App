import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Category, LibraryEntry, LibraryResponse, OrderScope } from "shared";
import { useAuth } from "../hooks/use-auth";
import { TopNav } from "../components/top-nav";
import { apiFetch } from "../lib/api";
import { parseFavoriteDragId } from "../lib/drag-ids";
import { ProfileHeader } from "../components/profile-header";
import { FavoritesRow, FAVORITES_DROP_ID } from "../components/favorites-row";
import { CategorySection } from "../components/category-section";
import { GameCard } from "../components/game-card";
import { GameCover } from "../components/game-cover";
import { AddGameModal } from "../components/add-game-modal";
import { ViewToggle } from "../components/view-toggle";
import { AllGamesGrid } from "../components/all-games-grid";

type ViewMode = "category" | "all";

type CategoryKey = "playing" | "playedBefore" | "wantToPlay";

const CATEGORY_KEYS: Record<Category, CategoryKey> = {
  PLAYING: "playing",
  PLAYED_BEFORE: "playedBefore",
  WANT_TO_PLAY: "wantToPlay",
};

// The sections a card or favorite can be dropped on, as opposed to the cards
// and favorites inside them.
const CONTAINER_IDS = new Set<string>([FAVORITES_DROP_ID, ...Object.keys(CATEGORY_KEYS)]);

// Dropping on a card means "put it here", dropping on the section around the
// cards means "put it at the end". Both are under the pointer at once, so the
// card has to win. With the keyboard there is no pointer, so it falls back to
// whatever the dragged item overlaps.
const collisionDetection: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const found = collisions.length > 0 ? collisions : rectIntersection(args);
  const inner = found.filter((collision) => !CONTAINER_IDS.has(String(collision.id)));
  return inner.length > 0 ? inner : found;
};

// What's being dragged: a card from a category, or a favorite from the row.
type ActiveDrag = { entry: LibraryEntry; kind: "card" | "favorite" };

function saveOrder(scope: OrderScope, entries: LibraryEntry[]) {
  return apiFetch("/library/order", {
    method: "PUT",
    body: JSON.stringify({ scope, ids: entries.map((entry) => entry.id) }),
  });
}

export function HomePage() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function refreshLibrary() {
    return apiFetch<LibraryResponse>("/library").then(setLibrary);
  }

  useEffect(() => {
    void refreshLibrary();
  }, []);

  function findCardEntry(entryId: string): LibraryEntry | undefined {
    if (!library) return undefined;
    return [...library.playing, ...library.playedBefore, ...library.wantToPlay].find((e) => e.id === entryId);
  }

  function handleDragStart(event: DragStartEvent) {
    if (!library) return;
    const activeId = String(event.active.id);
    const favoriteId = parseFavoriteDragId(activeId);
    if (favoriteId) {
      const entry = library.favorites.find((e) => e.id === favoriteId);
      setActiveDrag(entry ? { entry, kind: "favorite" } : null);
      return;
    }
    const entry = findCardEntry(activeId);
    setActiveDrag(entry ? { entry, kind: "card" } : null);
  }

  // The screen has already been updated; if saving fails, show what the server
  // actually has instead of guessing how to undo it.
  async function persist(save: () => Promise<unknown>) {
    try {
      await save();
    } catch {
      await refreshLibrary();
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || !library) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const overFavoriteId = parseFavoriteDragId(overId);

    // A favorite dragged within the row: reorder it.
    const draggedFavoriteId = parseFavoriteDragId(activeId);
    if (draggedFavoriteId) {
      if (!overFavoriteId || overFavoriteId === draggedFavoriteId) return;
      const from = library.favorites.findIndex((e) => e.id === draggedFavoriteId);
      const to = library.favorites.findIndex((e) => e.id === overFavoriteId);
      if (from === -1 || to === -1) return;

      const favorites = arrayMove(library.favorites, from, to);
      setLibrary({ ...library, favorites });
      await persist(() => saveOrder("FAVORITES", favorites));
      return;
    }

    const entry = findCardEntry(activeId);
    if (!entry) return;

    // A card dropped on the Favorites row: favorite it, in the spot it landed.
    if (overId === FAVORITES_DROP_ID || overFavoriteId) {
      if (entry.isFavorite) return;

      const updatedEntry: LibraryEntry = { ...entry, isFavorite: true };
      const replaceEntry = (entries: LibraryEntry[]) => entries.map((e) => (e.id === entry.id ? updatedEntry : e));
      const dropIndex = overFavoriteId ? library.favorites.findIndex((e) => e.id === overFavoriteId) : -1;
      const favorites = [...library.favorites];
      favorites.splice(dropIndex === -1 ? favorites.length : dropIndex, 0, updatedEntry);

      setLibrary({
        ...library,
        playing: replaceEntry(library.playing),
        playedBefore: replaceEntry(library.playedBefore),
        wantToPlay: replaceEntry(library.wantToPlay),
        favorites,
      });

      await persist(async () => {
        await apiFetch(`/library/${entry.id}`, { method: "PATCH", body: JSON.stringify({ isFavorite: true }) });
        // The server puts a new favorite at the end, which is already right
        // when it was dropped there.
        if (dropIndex !== -1) await saveOrder("FAVORITES", favorites);
      });
      return;
    }

    // Anything else is a category: dropped on a card (that spot) or on the
    // section itself (the end).
    const overCard = findCardEntry(overId);
    const targetCategory: Category | null = overCard ? overCard.category : overId in CATEGORY_KEYS ? (overId as Category) : null;
    if (!targetCategory) return;

    const sameCategory = entry.category === targetCategory;
    if (sameCategory && !overCard) return;
    if (overCard?.id === entry.id) return;

    const updatedEntry: LibraryEntry = { ...entry, category: targetCategory };
    const sourceKey = CATEGORY_KEYS[entry.category];
    const targetKey = CATEGORY_KEYS[targetCategory];

    let nextTarget: LibraryEntry[];
    if (sameCategory) {
      const list = library[targetKey];
      nextTarget = arrayMove(
        list,
        list.findIndex((e) => e.id === entry.id),
        list.findIndex((e) => e.id === overCard!.id),
      );
    } else {
      nextTarget = [...library[targetKey]];
      const dropIndex = overCard ? nextTarget.findIndex((e) => e.id === overCard.id) : nextTarget.length;
      nextTarget.splice(dropIndex, 0, updatedEntry);
    }

    setLibrary({
      ...library,
      [sourceKey]: sameCategory ? library[sourceKey] : library[sourceKey].filter((e) => e.id !== entry.id),
      [targetKey]: nextTarget,
      favorites: library.favorites.map((e) => (e.id === entry.id ? updatedEntry : e)),
    });

    await persist(async () => {
      if (!sameCategory) {
        await apiFetch(`/library/${entry.id}`, { method: "PATCH", body: JSON.stringify({ category: targetCategory }) });
      }
      // The server puts a game that changed category at the end; save the
      // order unless that's already where it was dropped.
      if (sameCategory || overCard) await saveOrder(targetCategory, nextTarget);
    });
  }

  if (!user || !library) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-text">
      <TopNav className="bg-surface" />

      <ProfileHeader user={user} />

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={() => setIsAddGameOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-accent-gradient px-4 py-2 font-baloo text-sm font-bold text-accent-foreground transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add game
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <FavoritesRow
            favorites={library.favorites}
            onAddGame={() => setIsAddGameOpen(true)}
            onChanged={() => void refreshLibrary()}
          />

          {viewMode === "all" ? (
            <AllGamesGrid library={library} onChanged={() => void refreshLibrary()} />
          ) : (
            <div className="flex flex-col gap-8">
              <CategorySection
                category="PLAYING"
                title="Playing"
                entries={library.playing}
                emptyMessage="Nothing here yet — add a game to get started."
                onAddGame={() => setIsAddGameOpen(true)}
                onChanged={() => void refreshLibrary()}
              />
              <CategorySection
                category="PLAYED_BEFORE"
                title="Played Before"
                entries={library.playedBefore}
                emptyMessage="Nothing here yet — add a game to get started."
                onAddGame={() => setIsAddGameOpen(true)}
                onChanged={() => void refreshLibrary()}
              />
              <CategorySection
                category="WANT_TO_PLAY"
                title="Want to Play"
                entries={library.wantToPlay}
                emptyMessage="Nothing here yet — add a game to get started."
                onAddGame={() => setIsAddGameOpen(true)}
                onChanged={() => void refreshLibrary()}
              />
            </div>
          )}

          <DragOverlay>
            {activeDrag &&
              (activeDrag.kind === "favorite" ? (
                <GameCover coverUrl={activeDrag.entry.game.coverUrl} title={activeDrag.entry.game.title} className="w-24 sm:w-28" />
              ) : (
                <GameCard entry={activeDrag.entry} onChanged={() => {}} />
              ))}
          </DragOverlay>
        </DndContext>
      </div>

      <AddGameModal open={isAddGameOpen} onClose={() => setIsAddGameOpen(false)} onAdded={() => void refreshLibrary()} />
    </main>
  );
}
