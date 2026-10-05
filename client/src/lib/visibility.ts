import type { Visibility } from "shared";

export const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Anyone with your link can see your full profile.",
  },
  {
    value: "FRIENDS",
    label: "Friends only",
    description: "Only your friends see your profile. Everyone else sees just your username.",
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only you can see your profile, and you don't show up in search.",
  },
];
