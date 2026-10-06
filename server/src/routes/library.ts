import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { endFavoritePosition, endPosition, getGroupedLibrary, topPosition } from "../lib/library.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const libraryRouter = Router();

const categorySchema = z.enum(["PLAYING", "PLAYED_BEFORE", "WANT_TO_PLAY"]);

const addToLibrarySchema = z.object({
  gameId: z.string().min(1),
  category: categorySchema,
  platform: z.string().min(1).max(50).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isFavorite: z.boolean().optional(),
});

const updateLibrarySchema = z.object({
  category: categorySchema.optional(),
  platform: z.string().min(1).max(50).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isFavorite: z.boolean().optional(),
});

const reorderSchema = z.object({
  scope: z.enum(["PLAYING", "PLAYED_BEFORE", "WANT_TO_PLAY", "FAVORITES"]),
  ids: z.array(z.string().min(1)).min(1).max(500),
});

libraryRouter.use(requireAuth);

libraryRouter.get("/", async (req, res) => {
  res.json(await getGroupedLibrary(req.userId!));
});

libraryRouter.post("/", async (req, res) => {
  const parsed = addToLibrarySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const userId = req.userId!;
  const { gameId, category, platform, rating, isFavorite } = parsed.data;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const existing = await prisma.userGame.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });
  if (existing) {
    res.status(409).json({ error: "Already in your library" });
    return;
  }

  const entry = await prisma.userGame.create({
    data: {
      userId,
      gameId,
      category,
      platform,
      rating,
      isFavorite,
      position: await topPosition(userId, category),
      favoritePosition: isFavorite ? await endFavoritePosition(userId) : 0,
    },
    include: { game: true },
  });
  res.status(201).json(entry);
});

// Saves the order of one list: a category, or the Favorites row. `ids` is the
// whole list as the user now sees it, first to last.
libraryRouter.put("/order", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { scope, ids } = parsed.data;
  const isFavorites = scope === "FAVORITES";

  if (new Set(ids).size !== ids.length) {
    res.status(400).json({ error: "Duplicate entries" });
    return;
  }

  // Every id has to be this user's and belong to the list being ordered.
  const rows = await prisma.userGame.findMany({
    where: { id: { in: ids }, userId: req.userId!, ...(isFavorites ? { isFavorite: true } : { category: scope }) },
    select: { id: true, position: true, favoritePosition: true },
  });
  if (rows.length !== ids.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const current = new Map(rows.map((row) => [row.id, isFavorites ? row.favoritePosition : row.position]));
  const changes = ids
    .map((id, index) => ({ id, index }))
    .filter(({ id, index }) => current.get(id) !== index);

  await prisma.$transaction(
    changes.map(({ id, index }) =>
      prisma.userGame.update({
        where: { id },
        data: isFavorites ? { favoritePosition: index } : { position: index },
        select: { id: true },
      }),
    ),
  );
  res.status(204).end();
});

libraryRouter.patch("/:id", async (req, res) => {
  const parsed = updateLibrarySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await prisma.userGame.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const data: Prisma.UserGameUpdateInput = { ...parsed.data };
  if (parsed.data.category && parsed.data.category !== existing.category) {
    data.position = await endPosition(existing.userId, parsed.data.category);
  }
  if (parsed.data.isFavorite && !existing.isFavorite) {
    data.favoritePosition = await endFavoritePosition(existing.userId);
  }

  const entry = await prisma.userGame.update({
    where: { id: req.params.id },
    data,
    include: { game: true },
  });
  res.json(entry);
});

libraryRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.userGame.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.userGame.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
