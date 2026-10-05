import { useState } from "react";
import type { PublicUser, SocialLink } from "shared";
import { apiFetch } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { Avatar } from "./avatar";
import { EditProfileModal } from "./edit-profile-modal";
import { ShareProfileButton } from "./share-profile-button";
import { SortableSocialLinks } from "./sortable-social-links";

const BIO_MAX_LENGTH = 280;

interface ProfileHeaderProps {
  user: PublicUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { updateUser } = useAuth();

  return (
    <header className="bg-surface px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row">
        <Avatar url={user.avatarUrl} username={user.username} className="h-20 w-20" />

        <div className="w-full min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-baloo text-xl font-bold">{user.username}</h1>
            <div className="flex items-center gap-2">
              <ShareProfileButton username={user.username} visibility={user.visibility} />
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="rounded-full border border-subtle px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
              >
                Edit profile
              </button>
            </div>
          </div>

          <BioEditor user={user} onUpdate={updateUser} />

          {user.socialLinks.length > 0 && (
            <SortableSocialLinks
              links={user.socialLinks}
              onReorder={(links: SocialLink[]) => updateUser({ ...user, socialLinks: links })}
            />
          )}
        </div>
      </div>

      <EditProfileModal open={isEditOpen} onClose={() => setIsEditOpen(false)} user={user} onUpdated={updateUser} />
    </header>
  );
}

interface BioEditorProps {
  user: PublicUser;
  onUpdate: (user: PublicUser) => void;
}

function BioEditor({ user, onUpdate }: BioEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(user.bio ?? "");

  async function handleBlur() {
    setIsEditing(false);
    if (value === (user.bio ?? "")) return;
    const updated = await apiFetch<PublicUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ bio: value || null }),
    });
    onUpdate(updated);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(user.bio ?? "");
          setIsEditing(true);
        }}
        className="mt-2 block w-full max-w-prose whitespace-normal break-words text-left text-sm text-muted transition-colors hover:text-text"
      >
        {user.bio ?? "No bio yet — click to add one."}
      </button>
    );
  }

  return (
    <div className="mt-2 flex max-w-prose flex-col gap-1">
      <textarea
        autoFocus
        rows={2}
        value={value}
        maxLength={BIO_MAX_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void handleBlur()}
        className="input-surface w-full break-words rounded-lg px-3 py-2 text-sm text-text"
      />
      <span className="text-xs text-muted">{BIO_MAX_LENGTH - value.length} characters remaining</span>
    </div>
  );
}
