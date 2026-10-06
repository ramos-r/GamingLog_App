// A game can sit in a category and in the Favorites row at once, and both
// places are draggable inside the same DndContext. A favorite's drag id gets a
// prefix so the two never share an id.
const FAVORITE_PREFIX = "fav:";

export function favoriteDragId(entryId: string): string {
  return `${FAVORITE_PREFIX}${entryId}`;
}

// The entry id behind a favorite's drag id, or null for any other id.
export function parseFavoriteDragId(dragId: string): string | null {
  return dragId.startsWith(FAVORITE_PREFIX) ? dragId.slice(FAVORITE_PREFIX.length) : null;
}
