import type { PublicUser, SocialLink, Visibility } from "shared";

export function toPublicUser(user: {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: Visibility;
  createdAt: Date;
  socialLinks?: SocialLink[];
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    visibility: user.visibility,
    createdAt: user.createdAt,
    socialLinks: user.socialLinks ?? [],
  };
}
