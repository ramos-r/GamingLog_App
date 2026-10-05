import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, UserPlus } from "lucide-react";
import type { SendFriendRequestResponse, ViewerFriendship, Visibility } from "shared";
import { apiFetch } from "../lib/api";
import { notifyFriendsChanged } from "../lib/friends-events";
import { loginUrlFor } from "../lib/safe-redirect";

interface FriendButtonProps {
  username: string;
  // null when the viewer is logged out.
  friendship: ViewerFriendship | null;
  profileVisibility: Visibility;
  onChanged: () => void;
}

const pillBase = "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors";
const outlinePill = `${pillBase} border border-subtle text-muted hover:text-text disabled:opacity-50`;
const accentPill = `${pillBase} bg-accent-gradient font-bold text-accent-foreground transition-transform hover:scale-105 disabled:opacity-50`;
const destructivePill = `${pillBase} bg-destructive font-bold text-white transition-transform hover:scale-105 disabled:opacity-50`;

export function FriendButton({ username, friendship, profileVisibility, onChanged }: FriendButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  // The button a keyboard user just activated is replaced by the next state's
  // controls, which would drop focus to the page. This flag asks for it back.
  const keepFocus = useRef(false);
  const state = friendship?.state;

  useEffect(() => {
    if (!keepFocus.current) return;
    keepFocus.current = false;
    container.current?.querySelector<HTMLElement>("button, a")?.focus();
  }, [state, confirming]);

  function setConfirmingWithFocus(value: boolean) {
    keepFocus.current = true;
    setConfirming(value);
  }

  async function run(request: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await request();
      keepFocus.current = true;
      setConfirming(false);
      notifyFriendsChanged();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const sendRequest = () =>
    run(() =>
      apiFetch<SendFriendRequestResponse>("/friends/requests", {
        method: "POST",
        body: JSON.stringify({ username }),
      }),
    );
  const accept = (id: string) => run(() => apiFetch(`/friends/requests/${id}/accept`, { method: "POST" }));
  const dropRequest = (id: string) => run(() => apiFetch(`/friends/requests/${id}`, { method: "DELETE" }));
  const unfriend = () => run(() => apiFetch(`/friends/${encodeURIComponent(username)}`, { method: "DELETE" }));

  let controls: ReactNode;

  if (friendship === null) {
    if (profileVisibility === "PRIVATE") return null;
    controls = (
      <Link to={loginUrlFor(`/u/${encodeURIComponent(username)}`)} className={outlinePill}>
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        Log in to add as a friend
      </Link>
    );
  } else if (friendship.state === "NONE") {
    if (profileVisibility === "PRIVATE") return null;
    controls = (
      <button type="button" onClick={() => void sendRequest()} disabled={busy} className={accentPill}>
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        Add friend
      </button>
    );
  } else if (friendship.state === "OUTGOING_PENDING") {
    controls = (
      <>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Request sent
        </span>
        <button
          type="button"
          onClick={() => void dropRequest(friendship.friendshipId!)}
          disabled={busy}
          className={outlinePill}
        >
          Cancel
        </button>
      </>
    );
  } else if (friendship.state === "INCOMING_PENDING") {
    controls = (
      <>
        <button type="button" onClick={() => void accept(friendship.friendshipId!)} disabled={busy} className={accentPill}>
          Accept
        </button>
        <button
          type="button"
          onClick={() => void dropRequest(friendship.friendshipId!)}
          disabled={busy}
          className={outlinePill}
        >
          Decline
        </button>
      </>
    );
  } else if (confirming) {
    controls = (
      <>
        <span className="text-xs text-text">
          Remove <span className="break-all font-medium">{username}</span> from your friends?
        </span>
        <button type="button" onClick={() => setConfirmingWithFocus(false)} disabled={busy} className={outlinePill}>
          Keep
        </button>
        <button type="button" onClick={() => void unfriend()} disabled={busy} className={destructivePill}>
          Unfriend
        </button>
      </>
    );
  } else {
    controls = (
      <button type="button" onClick={() => setConfirmingWithFocus(true)} disabled={busy} className={outlinePill}>
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Friends
      </button>
    );
  }

  return (
    <div ref={container} className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">{controls}</div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
