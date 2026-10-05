import { Router } from "express";
import { z } from "zod";
import { Prisma, type Visibility } from "@prisma/client";
import type { FriendListItem, FriendRequestCount, FriendsResponse, SendFriendRequestResponse } from "shared";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { findFriendship, otherUserId, pairKey } from "../lib/friends.js";
import { visibleAvatar } from "../lib/visibility.js";

export const friendsRouter = Router();

friendsRouter.use(requireAuth);
// These answers depend on who is asking and change as requests come and go.
friendsRouter.use((_req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  next();
});

const sendRequestSchema = z.object({ username: z.string().min(1).max(50) });

const userSelect = { id: true, username: true, avatarUrl: true, visibility: true } as const;

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

type SendResult =
  | { status: 200 | 201; body: SendFriendRequestResponse }
  | { status: 403 | 409; body: { error: string } };

// Runs the request rules once against whatever row exists right now. Returns
// null when the world changed underneath it (the row we meant to accept
// vanished, or someone else created the row first), so the caller can look
// again instead of failing.
async function attemptSend(me: string, them: { id: string; visibility: Visibility }): Promise<SendResult | null> {
  const existing = await findFriendship(me, them.id);

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return { status: 409, body: { error: "You're already friends" } };
    }
    if (existing.requesterId === me) {
      return { status: 409, body: { error: "Friend request already sent" } };
    }
    // They already asked you: asking back accepts theirs instead of creating
    // a second row. Only flips while it's still pending and still theirs.
    const accepted = await prisma.friendship.updateMany({
      where: { id: existing.id, status: "PENDING", requesterId: them.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    if (accepted.count === 1) {
      return { status: 200, body: { status: "ACCEPTED", friendshipId: existing.id } };
    }
    return null;
  }

  // Checked only after the existing-row cases, so a private user's own
  // request can still be accepted this way.
  if (them.visibility === "PRIVATE") {
    return { status: 403, body: { error: "This profile isn't accepting friend requests" } };
  }

  try {
    const created = await prisma.friendship.create({ data: { ...pairKey(me, them.id), requesterId: me } });
    return { status: 201, body: { status: "PENDING", friendshipId: created.id } };
  } catch (err) {
    if (isUniqueViolation(err)) return null;
    throw err;
  }
}

friendsRouter.get("/", async (req, res) => {
  const me = req.userId!;
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    include: { userA: { select: userSelect }, userB: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });

  const friends: FriendListItem[] = [];
  const incoming: FriendListItem[] = [];
  const outgoing: FriendListItem[] = [];

  for (const row of rows) {
    const other = otherUserId(row, me) === row.userAId ? row.userA : row.userB;
    const isFriend = row.status === "ACCEPTED";
    const item: FriendListItem = {
      friendshipId: row.id,
      username: other.username,
      // A friend's avatar shows unless their profile is private; a pending
      // requester's only if their profile is public.
      avatarUrl: visibleAvatar(me, other, isFriend),
    };

    if (isFriend) friends.push(item);
    else if (row.requesterId === me) outgoing.push(item);
    else incoming.push(item);
  }

  friends.sort((a, b) => a.username.localeCompare(b.username));
  const response: FriendsResponse = { friends, incoming, outgoing };
  res.json(response);
});

friendsRouter.get("/requests/count", async (req, res) => {
  const me = req.userId!;
  const incoming = await prisma.friendship.count({
    where: { status: "PENDING", requesterId: { not: me }, OR: [{ userAId: me }, { userBId: me }] },
  });
  const response: FriendRequestCount = { incoming };
  res.json(response);
});

friendsRouter.post("/requests", async (req, res) => {
  const parsed = sendRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const me = req.userId!;
  const them = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true, visibility: true },
  });
  if (!them) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (them.id === me) {
    res.status(400).json({ error: "You can't add yourself as a friend" });
    return;
  }

  // Double-clicks, two tabs, or both people clicking at once can race the
  // checks above against the unique constraint. Look again once; after two
  // attempts settle for a 409 rather than ever surfacing a 500.
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await attemptSend(me, them);
    if (result) {
      res.status(result.status).json(result.body);
      return;
    }
  }
  res.status(409).json({ error: "Couldn't send the request, please try again" });
});

friendsRouter.post("/requests/:id/accept", async (req, res) => {
  const me = req.userId!;
  const id = String(req.params.id);

  const accepted = await prisma.friendship.updateMany({
    where: {
      id,
      OR: [{ userAId: me }, { userBId: me }],
      status: "PENDING",
      requesterId: { not: me },
    },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  if (accepted.count === 0) {
    // Same answer whether the id doesn't exist, isn't yours, or you sent it.
    res.status(404).json({ error: "Not found" });
    return;
  }

  const response: SendFriendRequestResponse = { status: "ACCEPTED", friendshipId: id };
  res.json(response);
});

// Decline (you received it) or cancel (you sent it): either way the row goes.
friendsRouter.delete("/requests/:id", async (req, res) => {
  const me = req.userId!;
  const removed = await prisma.friendship.deleteMany({
    where: { id: String(req.params.id), OR: [{ userAId: me }, { userBId: me }], status: "PENDING" },
  });
  if (removed.count === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

friendsRouter.delete("/:username", async (req, res) => {
  const me = req.userId!;
  const them = await prisma.user.findUnique({
    where: { username: String(req.params.username) },
    select: { id: true },
  });
  if (!them) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const removed = await prisma.friendship.deleteMany({ where: { ...pairKey(me, them.id), status: "ACCEPTED" } });
  if (removed.count === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});
