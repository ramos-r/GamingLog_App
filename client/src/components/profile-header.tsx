import { useState } from "react";
import { UserRound } from "lucide-react";
import type { PublicUser } from "shared";
import { apiFetch } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { SocialPlatformIcon } from "./social-platform-icon";
import { EditProfileModal } from "./edit-profile-modal";

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
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="rounded-full border border-subtle px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
            >
              Edit profile
            </button>
          </div>

          <BioEditor user={user} onUpdate={updateUser} />

          {user.socialLinks.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {user.socialLinks.map((link) => (
                <li key={link.id} className="flex items-center gap-1.5 text-xs text-muted">
                  <SocialPlatformIcon platform={link.platform} className="h-4 w-4 shrink-0" />
                  {link.handle}
                </li>
              ))}
            </ul>
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
