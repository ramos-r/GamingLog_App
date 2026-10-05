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
      addedAt: true,
      updatedAt: true,
      game: { select: { id: true, title: true, genre: true, coverUrl: true, createdAt: true } },
    },
    orderBy: { addedAt: "desc" },
  });

  return {
    playing: entries.filter((entry) => entry.category === Category.PLAYING),
    playedBefore: entries.filter((entry) => entry.category === Category.PLAYED_BEFORE),
    wantToPlay: entries.filter((entry) => entry.category === Category.WANT_TO_PLAY),
    favorites: entries.filter((entry) => entry.isFavorite),
  };
}
