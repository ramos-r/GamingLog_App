import type { ReactNode } from "react";
import type { ProfileSummary } from "shared";
import { Avatar } from "./avatar";
import { SocialLinkList } from "./social-link-list";

interface PublicProfileHeaderProps {
  profile: ProfileSummary;
  // Right-hand slot (the friend button, once friendships exist).
  actions?: ReactNode;
}

export function PublicProfileHeader({ profile, actions }: PublicProfileHeaderProps) {
  return (
    <header className="bg-surface px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row">
        <Avatar url={profile.avatarUrl} username={profile.username} className="h-20 w-20" />

        <div className="w-full min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="break-all font-baloo text-xl font-bold">{profile.username}</h1>
            {actions}
          </div>

          {profile.bio && (
            <p className="mt-2 max-w-prose whitespace-normal break-words text-sm text-muted">{profile.bio}</p>
          )}

          <SocialLinkList links={profile.socialLinks} />
        </div>
      </div>
    </header>
  );
}
