// Hand-written mirrors of the public-facing shape of Prisma models — kept
// deliberately independent of @prisma/client's generated types so the
// client bundle never needs that package on its module graph. Update these
// alongside schema.prisma when a field changes.

export interface SocialLink {
  id: string;
  platform: string;
  handle: string;
  order: number;
}

export interface PublicUser {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  socialLinks: SocialLink[];
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface CatalogGame {
  id: string;
  title: string;
  genre: string | null;
  coverUrl: string | null;
  addedById: string | null;
  createdAt: Date;
}

export interface CreateGameInput {
  title: string;
  genre?: string;
  coverUrl?: string;
}

export type UpdateGameInput = Partial<CreateGameInput>;

export interface DuplicateGameError {
  error: string;
  existingGame: CatalogGame;
}

export type Category = "PLAYING" | "PLAYED_BEFORE" | "WANT_TO_PLAY";

export interface LibraryEntry {
  id: string;
  category: Category;
  platform: string | null;
  rating: number | null;
  isFavorite: boolean;
  addedAt: Date;
  updatedAt: Date;
  game: CatalogGame;
}

export interface LibraryResponse {
  playing: LibraryEntry[];
  playedBefore: LibraryEntry[];
  wantToPlay: LibraryEntry[];
  favorites: LibraryEntry[];
}

export interface AddToLibraryInput {
  gameId: string;
  category: Category;
  platform?: string;
  rating?: number;
  isFavorite?: boolean;
}

export interface UpdateLibraryInput {
  category?: Category;
  platform?: string | null;
  rating?: number | null;
  isFavorite?: boolean;
}

export interface IgdbSuggestion {
  title: string;
  genre: string | null;
  coverUrl: string | null;
  platforms: string[];
}

export interface UploadInput {
  filename: string;
  dataUrl: string;
}

export interface UploadResponse {
  url: string;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface SocialLinkInput {
  platform: string;
  handle: string;
}
