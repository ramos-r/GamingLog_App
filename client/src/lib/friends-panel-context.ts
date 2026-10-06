import { createContext } from "react";

// Matches Tailwind's `lg`: from here up the panel sits beside the page, below
// it the panel covers the page.
export const DESKTOP_QUERY = "(min-width: 1024px)";

export const FRIENDS_TOGGLE_ID = "friends-toggle";
export const FRIENDS_PANEL_ID = "friends-panel";

export interface FriendsPanelContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const FriendsPanelContext = createContext<FriendsPanelContextValue | null>(null);
