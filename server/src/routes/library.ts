import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getGroupedLibrary } from "../lib/library.js";
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
    data: { userId, gameId, category, platform, rating, isFavorite },
    include: { game: true },
  });
  res.status(201).json(entry);
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

  const entry = await prisma.userGame.update({
    where: { id: req.params.id },
    data: parsed.data,
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
