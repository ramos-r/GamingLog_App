import { UserRound } from "lucide-react";
import type { PublicUser } from "shared";
import { PlatformBadge } from "./platform-badge";

interface ProfileHeaderProps {
  user: PublicUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <header className="bg-surface px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-raised">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" role="img" aria-label={user.username}>
              <UserRound className="h-8 w-8 text-muted" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-baloo text-xl font-bold">{user.username}</h1>
            {/* Wired up in Phase 9 (edit profile modal). */}
            <button
              type="button"
              className="rounded-full border border-subtle px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
            >
              Edit profile
            </button>
          </div>

          <p className="mt-2 max-w-prose text-sm text-muted">{user.bio ?? "No bio yet."}</p>

          {user.socialLinks.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {user.socialLinks.map((link) => (
                <li key={link.id} className="flex items-center gap-1.5 text-xs text-muted">
                  <PlatformBadge platform={link.platform} />
                  {link.handle}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
