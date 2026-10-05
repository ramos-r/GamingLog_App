// Anything that changes a friendship (send, accept, decline, cancel, unfriend)
// calls notifyFriendsChanged() so other parts of the page, like the nav badge,
// can refetch without being wired to each other.
export const FRIENDS_CHANGED_EVENT = "gaminglog:friends-changed";

export function notifyFriendsChanged(): void {
  window.dispatchEvent(new Event(FRIENDS_CHANGED_EVENT));
}
