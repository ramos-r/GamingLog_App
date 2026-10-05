import type { Visibility } from "shared";

interface ProfileOwner {
  id: string;
  visibility: Visibility;
}

// The single place that decides who may see a full profile. Every route that
// returns another user's data goes through this (or visibleAvatar below) —
// no route decides visibility on its own.
export function canViewFullProfile(viewerId: string | null, owner: ProfileOwner, isFriend: boolean): boolean {
  if (viewerId !== null && viewerId === owner.id) return true;

  switch (owner.visibility) {
    case "PUBLIC":
      return true;
    case "FRIENDS":
      return viewerId !== null && isFriend;
    case "PRIVATE":
      // Private overrides friendship.
      return false;
  }
}

// An avatar is part of the full profile, so it's only ever returned to
// viewers who may see the full profile.
export function visibleAvatar(
  viewerId: string | null,
  owner: ProfileOwner & { avatarUrl: string | null },
  isFriend: boolean,
): string | null {
  return canViewFullProfile(viewerId, owner, isFriend) ? owner.avatarUrl : null;
}
