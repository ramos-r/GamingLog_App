import { useContext } from "react";
import { FriendsPanelContext } from "../lib/friends-panel-context";

export function useFriendsPanel() {
  const context = useContext(FriendsPanelContext);
  if (!context) {
    throw new Error("useFriendsPanel must be used within a FriendsPanelProvider");
  }
  return context;
}
