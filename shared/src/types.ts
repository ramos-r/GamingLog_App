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

export type Visibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export interface PublicUser {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: Visibility;
  createdAt: Date;
  socialLinks: SocialLink[];
}

// What someone else is allowed to see of a profile. Deliberately has no `id`
// or `createdAt` — the owner's internal id never leaves the server.
export interface ProfileSummary {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: Visibility;
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

// A catalog game as it appears inside a library. `addedById` is left out:
// for a game the owner added themselves it would hand their internal user id
// to whoever is viewing their profile.
export type LibraryGame = Omit<CatalogGame, "addedById">;

export interface LibraryEntry {
  id: string;
  category: Category;
  platform: string | null;
  rating: number | null;
  isFavorite: boolean;
  addedAt: Date;
  updatedAt: Date;
  game: LibraryGame;
}

export interface LibraryResponse {
  playing: LibraryEntry[];
  playedBefore: LibraryEntry[];
  wantToPlay: LibraryEntry[];
  favorites: LibraryEntry[];
}

// Friendship as seen from the viewer's side.
export type FriendshipState = "NONE" | "OUTGOING_PENDING" | "INCOMING_PENDING" | "FRIENDS";

export interface ViewerFriendship {
  state: FriendshipState;
  // Set whenever a row exists, so a page can accept, decline or cancel in place.
  friendshipId: string | null;
}

// `friendship` is null when the viewer is logged out.
export type PublicProfileResponse =
  | { access: "full"; profile: ProfileSummary; library: LibraryResponse; friendship: ViewerFriendship | null }
  | {
      access: "restricted";
      username: string;
      visibility: "FRIENDS" | "PRIVATE";
      friendship: ViewerFriendship | null;
    };

export interface UserSearchResult {
  username: string;
  avatarUrl: string | null;
  friendship: ViewerFriendship;
}

export interface FriendListItem {
  friendshipId: string;
  username: string;
  avatarUrl: string | null;
}

export interface FriendsResponse {
  friends: FriendListItem[];
  incoming: FriendListItem[];
  outgoing: FriendListItem[];
}

export interface FriendRequestCount {
  incoming: number;
}

export interface SendFriendRequestResponse {
  status: "PENDING" | "ACCEPTED";
  friendshipId: string;
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
  visibility?: Visibility;
}

export interface SocialLinkInput {
  platform: string;
  handle: string;
}
