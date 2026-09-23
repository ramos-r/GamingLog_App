import { Router } from "express";
import { z } from "zod";
import { del } from "@vercel/blob";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { AUTH_COOKIE_NAME, authCookieOptions, hashPassword } from "../lib/auth.js";
import { toPublicUser } from "../lib/users.js";

export const usersRouter = Router();

const updateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  password: z.string().min(8).optional(),
  bio: z.string().max(280).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  handle: z.string().min(1).max(100),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

usersRouter.use(requireAuth);

usersRouter.patch("/me", async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { username, password, bio, avatarUrl } = parsed.data;

  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== req.userId) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(username !== undefined && { username }),
      ...(password && { passwordHash: await hashPassword(password) }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    include: { socialLinks: { orderBy: { order: "asc" } } },
  });

  res.json(toPublicUser(user));
});

usersRouter.delete("/me", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (user.avatarUrl) {
    try {
      await del(user.avatarUrl);
    } catch {
      // Best-effort cleanup — a failed blob delete shouldn't block account deletion.
    }
  }

  await prisma.user.delete({ where: { id: req.userId } });
  res.clearCookie(AUTH_COOKIE_NAME, { path: authCookieOptions.path });
  res.status(204).end();
});

usersRouter.post("/me/social-links", async (req, res) => {
  const parsed = socialLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const count = await prisma.socialLink.count({ where: { userId: req.userId } });
  const link = await prisma.socialLink.create({
    data: { ...parsed.data, order: count, userId: req.userId! },
  });
  res.status(201).json(link);
});

usersRouter.patch("/me/social-links/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await prisma.socialLink.findMany({ where: { userId: req.userId } });
  const existingIds = new Set(existing.map((link) => link.id));
  const { orderedIds } = parsed.data;
  if (orderedIds.length !== existing.length || !orderedIds.every((id) => existingIds.has(id))) {
    res.status(400).json({ error: "orderedIds must match the user's existing social links" });
    return;
  }

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.socialLink.update({ where: { id }, data: { order: index } })),
  );

  const links = await prisma.socialLink.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } });
  res.json(links);
});

usersRouter.patch("/me/social-links/:id", async (req, res) => {
  const parsed = socialLinkSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const existing = await prisma.socialLink.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const link = await prisma.socialLink.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(link);
});

usersRouter.delete("/me/social-links/:id", async (req, res) => {
  const existing = await prisma.socialLink.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.socialLink.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
