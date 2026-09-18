import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { searchIgdbGames } from "../lib/igdb.js";

export const catalogRouter = Router();

const SEARCH_LIMIT = 20;

const createGameSchema = z.object({
  title: z.string().min(1).max(200),
  genre: z.string().min(1).max(100).optional(),
  coverUrl: z.string().url().optional(),
});

const updateGameSchema = createGameSchema.partial();

catalogRouter.use(requireAuth);

catalogRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  const games = await prisma.game.findMany({
    where: search ? { title: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: SEARCH_LIMIT,
  });

  res.json(games);
});

// Must come before "/:id" — otherwise Express would match "external-search"
// as an :id param.
catalogRouter.get("/external-search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const suggestions = query ? await searchIgdbGames(query) : [];
  res.json(suggestions);
});

catalogRouter.get("/:id", async (req, res) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(game);
});

catalogRouter.post("/", async (req, res) => {
  const parsed = createGameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { title, genre, coverUrl } = parsed.data;

  const existingGame = await prisma.game.findFirst({ where: { title } });
  if (existingGame) {
    res.status(409).json({ error: "A game with this title already exists", existingGame });
    return;
  }

  const game = await prisma.game.create({
    data: { title, genre, coverUrl, addedById: req.userId },
  });
  res.status(201).json(game);
});

catalogRouter.patch("/:id", async (req, res) => {
  const parsed = updateGameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const game = await prisma.game.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(game);
});
