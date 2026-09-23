// Distinct from lib/platforms.ts (which platform a game is played on) — this
// is which social network a profile link points to. Order and members
// per PLAN.md Phase 13 (no "PC" — not a profile-with-handle platform).
export const SOCIAL_PLATFORM_OPTIONS = [
  "Steam",
  "Xbox",
  "PlayStation",
  "Nintendo",
  "Discord",
  "Epic",
  "Battle.net",
  "Twitch",
  "Other",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORM_OPTIONS)[number];
