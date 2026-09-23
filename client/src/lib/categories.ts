import type { Category } from "shared";

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "PLAYING", label: "Playing" },
  { value: "PLAYED_BEFORE", label: "Played Before" },
  { value: "WANT_TO_PLAY", label: "Want to Play" },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  PLAYING: "Playing",
  PLAYED_BEFORE: "Played Before",
  WANT_TO_PLAY: "Want to Play",
};
