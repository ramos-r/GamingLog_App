import type { Friendship } from "@prisma/client";
import type { ViewerFriendship } from "shared";
import { prisma } from "./prisma.js";

// The only code that orders a pair. A friendship is stored once per pair of
// users in canonical order (userAId < userBId), and every lookup and create
// goes through here, so the unique constraint catches duplicates and crossed
// requests no matter which of the two sent first.
export function pairKey(a: string, b: string): { userAId: string; userBId: string } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export function findFriendship(a: string, b: string): Promise<Friendship | null> {
  return prisma.friendship.findUnique({ where: { userAId_userBId: pairKey(a, b) } });
}

export function otherUserId(row: Pick<Friendship, "userAId" | "userBId">, userId: string): string {
  return row.userAId === userId ? row.userBId : row.userAId;
}

export function toViewerFriendship(
  row: Pick<Friendship, "id" | "status" | "requesterId"> | null,
  viewerId: string,
): ViewerFriendship {
  if (!row) return { state: "NONE", friendshipId: null };
  if (row.status === "ACCEPTED") return { state: "FRIENDS", friendshipId: row.id };
  return {
    state: row.requesterId === viewerId ? "OUTGOING_PENDING" : "INCOMING_PENDING",
    friendshipId: row.id,
  };
}
