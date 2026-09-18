import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { hashPassword } from "../lib/auth.js";
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
    include: { socialLinks: true },
  });

  res.json(toPublicUser(user));
});

usersRouter.post("/me/social-links", async (req, res) => {
  const parsed = socialLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const link = await prisma.socialLink.create({
    data: { ...parsed.data, userId: req.userId! },
  });
  res.status(201).json(link);
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
