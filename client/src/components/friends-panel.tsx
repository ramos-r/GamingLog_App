import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Search, X } from "lucide-react";
import type { FriendListItem, FriendsResponse } from "shared";
import { useFriendsPanel } from "../hooks/use-friends-panel";
import { apiFetch } from "../lib/api";
import { FRIENDS_CHANGED_EVENT, notifyFriendsChanged } from "../lib/friends-events";
import { DESKTOP_QUERY, FRIENDS_PANEL_ID, FRIENDS_TOGGLE_ID } from "../lib/friends-panel-context";
import { Avatar } from "./avatar";

type LoadState = { status: "loading" } | { status: "error" } | { status: "done"; data: FriendsResponse };

const iconButton =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-subtle text-muted transition-colors hover:text-text disabled:opacity-50";

// Side panel with the user's friends and friend requests. Beside the page on
// wide screens, over it on narrow ones. Only mounted while open, so it
// doesn't fetch anything while closed.
export function FriendsPanel() {
  const { close } = useFriendsPanel();
  const { pathname } = useLocation();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let ignore = false;
    apiFetch<FriendsResponse>("/friends")
      .then((data) => {
        if (!ignore) setState({ status: "done", data });
      })
      .catch(() => {
        if (!ignore) setState({ status: "error" });
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey, pathname]);

  // Friend actions elsewhere (the button on a profile page) update this list too.
  useEffect(() => {
    window.addEventListener(FRIENDS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(FRIENDS_CHANGED_EVENT, reload);
  }, [reload]);

  function closeAndRestoreFocus() {
    close();
    document.getElementById(FRIENDS_TOGGLE_ID)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeAndRestoreFocus();
    }
  }

  // Over the page (narrow screens) a chosen profile should be visible, not
  // hidden behind the panel.
  function handleNavigate() {
    if (!window.matchMedia(DESKTOP_QUERY).matches) close();
  }

  async function act(item: FriendListItem, request: () => Promise<unknown>) {
    setBusyId(item.friendshipId);
    setActionError(null);
    try {
      await request();
      notifyFriendsChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  const accept = (item: FriendListItem) =>
    act(item, () => apiFetch(`/friends/requests/${item.friendshipId}/accept`, { method: "POST" }));
  const remove = (item: FriendListItem) =>
    act(item, () => apiFetch(`/friends/requests/${item.friendshipId}`, { method: "DELETE" }));

  const data = state.status === "done" ? state.data : null;

  function renderRow(item: FriendListItem, actions?: ReactNode) {
    return (
      <li key={item.friendshipId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-raised">
        <Link
          to={`/u/${encodeURIComponent(item.username)}`}
          onClick={handleNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded"
        >
          <Avatar url={item.avatarUrl} username={item.username} className="h-8 w-8" />
          <span className="min-w-0 break-all font-baloo text-sm font-medium">{item.username}</span>
        </Link>
        {actions}
      </li>
    );
  }

  return (
    <>
      {/* Narrow screens: tapping outside closes the panel. */}
      <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-hidden="true" onClick={closeAndRestoreFocus} />

      <aside
        id={FRIENDS_PANEL_ID}
        aria-label="Friends"
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 right-0 z-40 flex w-72 max-w-full flex-col border-l border-subtle bg-surface lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:shrink-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-subtle px-4 py-3">
          <h2 className="font-baloo text-base font-bold">Friends</h2>
          <div className="flex items-center gap-1">
            <Link
              to="/people"
              onClick={handleNavigate}
              aria-label="Find people"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={closeAndRestoreFocus}
              aria-label="Close friends panel"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4" aria-live="polite">
          {actionError && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {actionError}
            </p>
          )}

          {state.status === "loading" && <p className="px-2 text-sm text-muted">Loading…</p>}
          {state.status === "error" && <p className="px-2 text-sm text-muted">Something went wrong. Please try again.</p>}

          {data && data.incoming.length > 0 && (
            <Section title="Requests" count={data.incoming.length}>
              {data.incoming.map((item) =>
                renderRow(
                  item,
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === item.friendshipId}
                      onClick={() => void accept(item)}
                      aria-label={`Accept request from ${item.username}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-gradient text-accent-foreground transition-transform hover:scale-105 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.friendshipId}
                      onClick={() => void remove(item)}
                      aria-label={`Decline request from ${item.username}`}
                      className={iconButton}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>,
                ),
              )}
            </Section>
          )}

          {data && data.outgoing.length > 0 && (
            <Section title="Sent" count={data.outgoing.length}>
              {data.outgoing.map((item) =>
                renderRow(
                  item,
                  <button
                    type="button"
                    disabled={busyId === item.friendshipId}
                    onClick={() => void remove(item)}
                    aria-label={`Cancel request to ${item.username}`}
                    className={iconButton}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>,
                ),
              )}
            </Section>
          )}

          {data && (
            <Section title="Friends" count={data.friends.length}>
              {data.friends.length === 0 ? (
                <li className="px-2 text-sm text-muted">You haven't added any friends yet.</li>
              ) : (
                data.friends.map((item) => renderRow(item))
              )}
            </Section>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted">
        {title} — {count}
      </h3>
      <ul className="flex flex-col">{children}</ul>
    </section>
  );
}
