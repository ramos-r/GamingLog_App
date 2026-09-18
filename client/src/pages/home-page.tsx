import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { LibraryResponse } from "shared";
import { useAuth } from "../hooks/use-auth";
import { apiFetch } from "../lib/api";
import { ProfileHeader } from "../components/profile-header";
import { FavoritesRow } from "../components/favorites-row";
import { CategorySection } from "../components/category-section";
import { AddGameModal } from "../components/add-game-modal";

export function HomePage() {
  const { user, logout } = useAuth();
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);

  function refreshLibrary() {
    return apiFetch<LibraryResponse>("/library").then(setLibrary);
  }

  useEffect(() => {
    void refreshLibrary();
  }, []);

  if (!user || !library) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-24 text-text">
      <div className="flex justify-end px-4 pt-3 sm:px-8">
        <button type="button" onClick={() => void logout()} className="text-xs text-muted transition-colors hover:text-text">
          Log out
        </button>
      </div>

      <ProfileHeader user={user} />

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
        <FavoritesRow favorites={library.favorites} />
        <CategorySection
          title="Playing"
          entries={library.playing}
          emptyMessage="Nothing here yet — add a game to get started."
          onAddGame={() => setIsAddGameOpen(true)}
        />
        <CategorySection
          title="Played Before"
          entries={library.playedBefore}
          emptyMessage="Nothing here yet — add a game to get started."
          onAddGame={() => setIsAddGameOpen(true)}
        />
        <CategorySection
          title="Want to Play"
          entries={library.wantToPlay}
          emptyMessage="Nothing here yet — add a game to get started."
          onAddGame={() => setIsAddGameOpen(true)}
        />
      </div>

      <button
        type="button"
        aria-label="Add game"
        onClick={() => setIsAddGameOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-accent-foreground shadow-2xl transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddGameModal open={isAddGameOpen} onClose={() => setIsAddGameOpen(false)} onAdded={() => void refreshLibrary()} />
    </main>
  );
}
