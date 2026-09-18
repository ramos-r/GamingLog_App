import type { PublicUser, SocialLink } from "shared";

export function toPublicUser(user: {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  socialLinks?: SocialLink[];
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    socialLinks: user.socialLinks ?? [],
  };
}
