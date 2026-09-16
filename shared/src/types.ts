// Hand-written mirrors of the public-facing shape of Prisma models — kept
// deliberately independent of @prisma/client's generated types so the
// client bundle never needs that package on its module graph. Update these
// alongside schema.prisma when a field changes.

export interface PublicUser {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}
