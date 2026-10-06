import { Category } from "@prisma/client";
import type { LibraryResponse } from "shared";
import { prisma } from "./prisma.js";

// Selects exactly the LibraryEntry fields, so neither the owner's userId nor
// the catalog game's addedById (which can be the owner's id) ever leaves the
// server — this result is also served to people viewing someone's profile.
export async function getGroupedLibrary(userId: string): Promise<LibraryResponse> {
  const entries = await prisma.userGame.findMany({
    where: { userId },
    select: {
      id: true,
      category: true,
      platform: true,
      rating: true,
      isFavorite: true,
      favoritePosition: true,
      addedAt: true,
      updatedAt: true,
      game: { select: { id: true, title: true, genre: true, coverUrl: true, createdAt: true } },
    },
    orderBy: [{ position: "asc" }, { addedAt: "desc" }],
  });

  // The query order is the category order; Favorites have their own.
  const favorites = entries
    .filter((entry) => entry.isFavorite)
    .sort((a, b) => a.favoritePosition - b.favoritePosition || b.addedAt.getTime() - a.addedAt.getTime());
  const toEntry = ({ favoritePosition: _favoritePosition, ...entry }: (typeof entries)[number]) => entry;

  return {
    playing: entries.filter((entry) => entry.category === Category.PLAYING).map(toEntry),
    playedBefore: entries.filter((entry) => entry.category === Category.PLAYED_BEFORE).map(toEntry),
    wantToPlay: entries.filter((entry) => entry.category === Category.WANT_TO_PLAY).map(toEntry),
    favorites: favorites.map(toEntry),
  };
}

// Where a game lands when it joins a category: on top, like before ordering
// existed, so a newly added game is the first thing you see.
export async function topPosition(userId: string, category: Category): Promise<number> {
  const { _min } = await prisma.userGame.aggregate({ where: { userId, category }, _min: { position: true } });
  return (_min.position ?? 1) - 1;
}

// Where a game lands when it moves into another category: at the end.
export async function endPosition(userId: string, category: Category): Promise<number> {
  const { _max } = await prisma.userGame.aggregate({ where: { userId, category }, _max: { position: true } });
  return (_max.position ?? -1) + 1;
}

// Where a game lands when it becomes a favorite: at the end of the row.
export async function endFavoritePosition(userId: string): Promise<number> {
  const { _max } = await prisma.userGame.aggregate({
    where: { userId, isFavorite: true },
    _max: { favoritePosition: true },
  });
  return (_max.favoritePosition ?? -1) + 1;
}
