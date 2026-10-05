import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import type { FriendListItem, FriendsResponse } from "shared";
import { apiFetch } from "../lib/api";
import { notifyFriendsChanged } from "../lib/friends-events";
import { TopNav } from "../components/top-nav";
import { Avatar } from "../components/avatar";

type TabId = "friends" | "requests" | "sent";

const TABS: { id: TabId; label: string }[] = [
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "sent", label: "Sent" },
];

const EMPTY_MESSAGES: Record<TabId, string> = {
  friends: "You haven't added any friends yet.",
  requests: "No pending requests.",
  sent: "You haven't sent any requests.",
};

type LoadState = { status: "loading" } | { status: "error" } | { status: "done"; data: FriendsResponse };

const rowButton = "rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50";

export function FriendsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabId = searchParams.get("tab") === "requests" ? "requests" : searchParams.get("tab") === "sent" ? "sent" : "friends";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ friends: null, requests: null, sent: null });

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
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  function selectTab(next: TabId) {
    setSearchParams(next === "friends" ? {} : { tab: next }, { replace: true });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = TABS.findIndex((t) => t.id === tab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextId = TABS[nextIndex].id;
    selectTab(nextId);
    tabRefs.current[nextId]?.focus();
  }

  async function act(item: FriendListItem, request: () => Promise<unknown>) {
    setBusyId(item.friendshipId);
    setActionError(null);
    try {
      await request();
      notifyFriendsChanged();
      reload();
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
  const lists: Record<TabId, FriendListItem[]> = {
    friends: data?.friends ?? [],
    requests: data?.incoming ?? [],
    sent: data?.outgoing ?? [],
  };
  const items = lists[tab];

  return (
    <main className="min-h-screen bg-background pb-16 text-text">
      <TopNav />

      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-baloo text-xl font-bold">Friends</h1>
          <Link
            to="/people"
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-text"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Find people
          </Link>
        </div>

        <div role="tablist" aria-label="Friends" className="flex gap-1 border-b border-subtle">
          {TABS.map(({ id, label }) => {
            const count = lists[id].length;
            const selected = tab === id;
            return (
              <button
                key={id}
                ref={(node) => {
                  tabRefs.current[id] = node;
                }}
                type="button"
                role="tab"
                id={`friends-tab-${id}`}
                aria-selected={selected}
                aria-controls="friends-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(id)}
                onKeyDown={handleTabKeyDown}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  selected ? "border-accent text-text" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-accent-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div id="friends-panel" role="tabpanel" aria-labelledby={`friends-tab-${tab}`} tabIndex={0} className="flex flex-col gap-3">
          {actionError && (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          )}

          {state.status === "loading" && <p className="text-sm text-muted">Loading…</p>}
          {state.status === "error" && <p className="text-sm text-muted">Something went wrong. Please try again.</p>}
          {data && items.length === 0 && <p className="text-sm text-muted">{EMPTY_MESSAGES[tab]}</p>}

          {data && items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const busy = busyId === item.friendshipId;
                return (
                  <li key={item.friendshipId} className="flex items-center gap-3 rounded-lg bg-surface p-3">
                    <Link
                      to={`/u/${encodeURIComponent(item.username)}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded transition-opacity hover:opacity-80"
                    >
                      <Avatar url={item.avatarUrl} username={item.username} className="h-10 w-10" />
                      <span className="min-w-0 break-all font-baloo text-sm font-medium">{item.username}</span>
                    </Link>

                    {tab === "requests" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void accept(item)}
                          aria-label={`Accept request from ${item.username}`}
                          className={`${rowButton} bg-accent-gradient font-bold text-accent-foreground hover:scale-105`}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(item)}
                          aria-label={`Decline request from ${item.username}`}
                          className={`${rowButton} border border-subtle text-muted hover:text-text`}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {tab === "sent" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(item)}
                        aria-label={`Cancel request to ${item.username}`}
                        className={`${rowButton} shrink-0 border border-subtle text-muted hover:text-text`}
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
