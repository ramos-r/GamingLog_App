import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import type { PublicProfileResponse } from "shared";
import { useAuth } from "../hooks/use-auth";
import { ApiError, apiFetch } from "../lib/api";
import { TopNav } from "../components/top-nav";
import { Avatar } from "../components/avatar";
import { FriendButton } from "../components/friend-button";
import { PublicProfileHeader } from "../components/public-profile-header";
import { ViewToggle } from "../components/view-toggle";
import { FavoritesRow } from "../components/favorites-row";
import { CategorySection } from "../components/category-section";
import { AllGamesGrid } from "../components/all-games-grid";

// What came back, tagged with the username and viewer it belongs to, so a
// response for a previously viewed profile (or for the previous login state)
// is never shown against the current one.
type PageState =
  | { username: string; viewerId: string | undefined; kind: "loaded"; data: PublicProfileResponse }
  | { username: string; viewerId: string | undefined; kind: "not-found" }
  | { username: string; viewerId: string | undefined; kind: "error" };

const EMPTY_MESSAGE = "Nothing here yet.";

export function PublicProfilePage() {
  const { username = "" } = useParams();
  const { user, isLoading } = useAuth();
  const [state, setState] = useState<PageState | null>(null);
  const [viewMode, setViewMode] = useState<"category" | "all">("category");
  const [reloadKey, setReloadKey] = useState(0);
  const viewerId = user?.id;
  // Bumped after a friend action so the page refetches what it may now show.
  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    // Wait until we know whether the visitor is logged in: the answer depends
    // on who is asking.
    if (isLoading) return;

    let ignore = false;
    apiFetch<PublicProfileResponse>(`/users/${encodeURIComponent(username)}`)
      .then((data) => {
        if (!ignore) setState({ username, viewerId, kind: "loaded", data });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        const kind = err instanceof ApiError && err.status === 404 ? "not-found" : "error";
        setState({ username, viewerId, kind });
      });

    return () => {
      ignore = true;
    };
  }, [username, viewerId, isLoading, reloadKey]);

  if (!isLoading && user && user.username === username) {
    return <Navigate to="/" replace />;
  }

  const current = state && state.username === username && state.viewerId === viewerId ? state : null;

  if (!current) {
    return (
      <PageShell>
        <p className="px-4 py-16 text-center text-sm text-muted">Loading…</p>
      </PageShell>
    );
  }

  if (current.kind === "not-found") {
    return (
      <PageShell>
        <MessageCard title="User not found">
          <Link to="/" className="text-sm font-medium text-accent-light transition-colors hover:text-accent">
            Go home
          </Link>
        </MessageCard>
      </PageShell>
    );
  }

  if (current.kind === "error") {
    return (
      <PageShell>
        <MessageCard title="Something went wrong" />
      </PageShell>
    );
  }

  const { data } = current;

  if (data.access === "restricted") {
    return (
      <PageShell>
        <MessageCard title={data.username} showAvatar>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            {data.visibility === "PRIVATE" ? "This profile is private." : "Only friends can see this profile."}
          </p>
          <FriendButton
            username={data.username}
            friendship={data.friendship}
            profileVisibility={data.visibility}
            onChanged={refetch}
          />
        </MessageCard>
      </PageShell>
    );
  }

  const { profile, library } = data;

  return (
    <PageShell>
      <PublicProfileHeader
        profile={profile}
        actions={
          <FriendButton
            username={profile.username}
            friendship={data.friendship}
            profileVisibility={profile.visibility}
            onChanged={refetch}
          />
        }
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <ViewToggle value={viewMode} onChange={setViewMode} />

        <FavoritesRow favorites={library.favorites} readOnly />

        {viewMode === "all" ? (
          <AllGamesGrid library={library} readOnly />
        ) : (
          <div className="flex flex-col gap-8">
            <CategorySection category="PLAYING" title="Playing" entries={library.playing} emptyMessage={EMPTY_MESSAGE} readOnly />
            <CategorySection
              category="PLAYED_BEFORE"
              title="Played Before"
              entries={library.playedBefore}
              emptyMessage={EMPTY_MESSAGE}
              readOnly
            />
            <CategorySection
              category="WANT_TO_PLAY"
              title="Want to Play"
              entries={library.wantToPlay}
              emptyMessage={EMPTY_MESSAGE}
              readOnly
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background pb-16 text-text">
      <TopNav />
      {children}
    </main>
  );
}

interface MessageCardProps {
  title: string;
  showAvatar?: boolean;
  children?: ReactNode;
}

// Centered card for everything that isn't a full profile. The avatar here is
// always the placeholder: a restricted profile's real image is never sent.
function MessageCard({ title, showAvatar = false, children }: MessageCardProps) {
  return (
    <div className="mx-auto mt-12 flex w-[calc(100%-2rem)] max-w-md flex-col items-center gap-3 rounded-2xl border border-subtle bg-surface p-8 text-center">
      {showAvatar && <Avatar url={null} username={title} className="h-20 w-20" />}
      <h1 className="break-all font-baloo text-xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
