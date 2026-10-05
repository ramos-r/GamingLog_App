import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Category, LibraryEntry, LibraryResponse } from "shared";
import { useAuth } from "../hooks/use-auth";
import { TopNav } from "../components/top-nav";
import { apiFetch } from "../lib/api";
import { ProfileHeader } from "../components/profile-header";
import { FavoritesRow, FAVORITES_DROP_ID } from "../components/favorites-row";
import { CategorySection } from "../components/category-section";
import { GameCard } from "../components/game-card";
import { AddGameModal } from "../components/add-game-modal";
import { ViewToggle } from "../components/view-toggle";
import { AllGamesGrid } from "../components/all-games-grid";

type ViewMode = "category" | "all";

export function HomePage() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<LibraryEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function refreshLibrary() {
    return apiFetch<LibraryResponse>("/library").then(setLibrary);
  }

  useEffect(() => {
    void refreshLibrary();
  }, []);

  function findEntry(entryId: string): LibraryEntry | undefined {
    if (!library) return undefined;
    return [...library.playing, ...library.playedBefore, ...library.wantToPlay].find((e) => e.id === entryId);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveEntry(findEntry(event.active.id as string) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveEntry(null);
    const { active, over } = event;
    if (!over || !library) return;

    const entry = findEntry(active.id as string);
    if (!entry) return;

    if (over.id === FAVORITES_DROP_ID) {
      if (entry.isFavorite) return;

      const previousLibrary = library;
      const updatedEntry: LibraryEntry = { ...entry, isFavorite: true };
      const replaceEntry = (entries: LibraryEntry[]) => entries.map((e) => (e.id === entry.id ? updatedEntry : e));

      setLibrary((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playing: replaceEntry(prev.playing),
          playedBefore: replaceEntry(prev.playedBefore),
          wantToPlay: replaceEntry(prev.wantToPlay),
          favorites: [...prev.favorites, updatedEntry],
        };
      });

      try {
        await apiFetch(`/library/${entry.id}`, { method: "PATCH", body: JSON.stringify({ isFavorite: true }) });
      } catch {
        setLibrary(previousLibrary);
      }
      return;
    }

    const newCategory = over.id as Category;
    if (entry.category === newCategory) return;

    const previousLibrary = library;
    const updatedEntry: LibraryEntry = { ...entry, category: newCategory };
    const withoutEntry = (entries: LibraryEntry[]) => entries.filter((e) => e.id !== entry.id);

    setLibrary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playing: newCategory === "PLAYING" ? [...withoutEntry(prev.playing), updatedEntry] : withoutEntry(prev.playing),
        playedBefore:
          newCategory === "PLAYED_BEFORE" ? [...withoutEntry(prev.playedBefore), updatedEntry] : withoutEntry(prev.playedBefore),
        wantToPlay:
          newCategory === "WANT_TO_PLAY" ? [...withoutEntry(prev.wantToPlay), updatedEntry] : withoutEntry(prev.wantToPlay),
        favorites: prev.favorites.map((e) => (e.id === entry.id ? updatedEntry : e)),
      };
    });

    try {
      await apiFetch(`/library/${entry.id}`, { method: "PATCH", body: JSON.stringify({ category: newCategory }) });
    } catch {
      setLibrary(previousLibrary);
    }
  }

  if (!user || !library) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-text">
      <TopNav />

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

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

          <DragOverlay>{activeEntry && <GameCard entry={activeEntry} onChanged={() => {}} />}</DragOverlay>
        </DndContext>
      </div>

      <AddGameModal open={isAddGameOpen} onClose={() => setIsAddGameOpen(false)} onAdded={() => void refreshLibrary()} />
    </main>
  );
}
