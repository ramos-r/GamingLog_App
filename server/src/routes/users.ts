import { Router } from "express";
import { z } from "zod";
import { del } from "@vercel/blob";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { AUTH_COOKIE_NAME, authCookieOptions, hashPassword } from "../lib/auth.js";
import { toPublicUser } from "../lib/users.js";
import { getGroupedLibrary } from "../lib/library.js";
import { findFriendship, otherUserId, pairKey, toViewerFriendship } from "../lib/friends.js";
import { canViewFullProfile, visibleAvatar } from "../lib/visibility.js";
import type { PublicProfileResponse, UserSearchResult } from "shared";

export const usersRouter = Router();

const updateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  password: z.string().min(8).optional(),
  bio: z.string().max(280).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  visibility: z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]).optional(),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  handle: z.string().min(1).max(100),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

// Only the /me routes are protected here: the two routes at the bottom of this
// file set their own auth (search needs a login, the profile link doesn't).
usersRouter.use("/me", requireAuth);

usersRouter.patch("/me", async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { username, password, bio, avatarUrl, visibility } = parsed.data;

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
      ...(visibility !== undefined && { visibility }),
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

usersRouter.get("/", requireAuth, async (req, res) => {
  res.set("Cache-Control", "private, no-store");

  const raw = typeof req.query.search === "string" ? req.query.search : "";
  const q = raw.trim().slice(0, 20);
  if (q.length < 2) {
    res.json([]);
    return;
  }

  const viewerId = req.userId!;
  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      visibility: { in: ["PUBLIC", "FRIENDS"] },
      id: { not: viewerId },
    },
    orderBy: { username: "asc" },
    take: 20,
    select: { id: true, username: true, avatarUrl: true, visibility: true },
  });

  // One query for the viewer's friendship with every result.
  const rows =
    users.length === 0
      ? []
      : await prisma.friendship.findMany({ where: { OR: users.map((user) => pairKey(viewerId, user.id)) } });
  const rowByOtherUser = new Map(rows.map((row) => [otherUserId(row, viewerId), row]));

  const results: UserSearchResult[] = users.map((user) => {
    const row = rowByOtherUser.get(user.id) ?? null;
    return {
      username: user.username,
      avatarUrl: visibleAvatar(viewerId, user, row?.status === "ACCEPTED"),
      friendship: toViewerFriendship(row, viewerId),
    };
  });
  res.json(results);
});

// Must stay last: "/:username" would otherwise swallow the fixed paths above.
usersRouter.get("/:username", optionalAuth, async (req, res) => {
  // The answer depends on the viewer's cookie, so it must never be cached and
  // then served to someone else.
  res.set("Cache-Control", "private, no-store");

  const owner = await prisma.user.findUnique({
    where: { username: String(req.params.username) },
    include: { socialLinks: { orderBy: { order: "asc" } } },
  });
  if (!owner) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const viewerId = req.userId ?? null;
  const row = viewerId !== null && viewerId !== owner.id ? await findFriendship(viewerId, owner.id) : null;
  const isFriend = row?.status === "ACCEPTED";
  const friendship = viewerId !== null ? toViewerFriendship(row, viewerId) : null;

  if (!canViewFullProfile(viewerId, owner, isFriend)) {
    const restricted: PublicProfileResponse = {
      access: "restricted",
      username: owner.username,
      visibility: owner.visibility === "PRIVATE" ? "PRIVATE" : "FRIENDS",
      friendship,
    };
    res.json(restricted);
    return;
  }

  const full: PublicProfileResponse = {
    access: "full",
    profile: {
      username: owner.username,
      bio: owner.bio,
      avatarUrl: owner.avatarUrl,
      visibility: owner.visibility,
      socialLinks: owner.socialLinks.map(({ id, platform, handle, order }) => ({ id, platform, handle, order })),
    },
    library: await getGroupedLibrary(owner.id),
    friendship,
  };
  res.json(full);
});
