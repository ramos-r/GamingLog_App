import { useCallback, useMemo, useState, type ReactNode } from "react";
import { DESKTOP_QUERY, FriendsPanelContext } from "../lib/friends-panel-context";

const STORAGE_KEY = "gaminglog:friends-panel-open";

function readInitialOpen(): boolean {
  try {
    // A remembered "open" only applies where the panel sits beside the page.
    // On a phone it would cover the profile every time the app loads.
    return localStorage.getItem(STORAGE_KEY) === "1" && window.matchMedia(DESKTOP_QUERY).matches;
  } catch {
    return false;
  }
}

function remember(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // Remembering is a convenience; the panel works without it.
  }
}

// Keeps the friends panel open or closed across pages until the user decides
// otherwise.
export function FriendsPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(readInitialOpen);

  const toggle = useCallback(() => {
    setIsOpen(!isOpen);
    remember(!isOpen);
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    remember(false);
  }, []);

  const value = useMemo(() => ({ isOpen, toggle, close }), [isOpen, toggle, close]);

  return <FriendsPanelContext.Provider value={value}>{children}</FriendsPanelContext.Provider>;
}
