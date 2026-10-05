import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, X } from "lucide-react";
import type { PublicUser, SocialLink, Visibility } from "shared";
import { apiFetch, ApiError } from "../lib/api";
import { uploadFile } from "../lib/upload";
import { SOCIAL_PLATFORM_OPTIONS } from "../lib/social-platforms";
import { useAuth } from "../hooks/use-auth";
import { Modal } from "./modal";
import { SocialPlatformSelect } from "./social-platform-select";
import { VisibilitySelect } from "./visibility-select";

const BIO_MAX_LENGTH = 280;

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: PublicUser;
  onUpdated: (user: PublicUser) => void;
}

export function EditProfileModal({ open, onClose, user, onUpdated }: EditProfileModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      {/* Mounted only while open, so its form state starts fresh each time. */}
      {open && <EditProfileForm user={user} onUpdated={onUpdated} onClose={onClose} />}
    </Modal>
  );
}

interface LinkRow extends SocialLink {
  isNew?: boolean;
}

interface EditProfileFormProps {
  user: PublicUser;
  onUpdated: (user: PublicUser) => void;
  onClose: () => void;
}

function EditProfileForm({ user, onUpdated, onClose }: EditProfileFormProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState(user.bio ?? "");
  const [visibility, setVisibility] = useState<Visibility>(user.visibility);
  const [links, setLinks] = useState<LinkRow[]>(user.socialLinks.map((link) => ({ ...link })));
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      const updated = await apiFetch<PublicUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: url }),
      });
      setAvatarUrl(updated.avatarUrl);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setError(null);
    try {
      const updated = await apiFetch<PublicUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: null }),
      });
      setAvatarUrl(null);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  function addLink() {
    setLinks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), platform: SOCIAL_PLATFORM_OPTIONS[0], handle: "", order: prev.length, isNew: true },
    ]);
  }

  function updateLink(id: string, patch: Partial<Pick<LinkRow, "platform" | "handle">>) {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...patch } : link)));
  }

  function removeLink(link: LinkRow) {
    if (!link.isNew) {
      setRemovedIds((prev) => [...prev, link.id]);
    }
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      for (const id of removedIds) {
        await apiFetch(`/users/me/social-links/${id}`, { method: "DELETE" });
      }

      for (const link of links) {
        if (!link.handle.trim()) continue;
        if (link.isNew) {
          await apiFetch("/users/me/social-links", {
            method: "POST",
            body: JSON.stringify({ platform: link.platform, handle: link.handle }),
          });
        } else {
          const original = user.socialLinks.find((l) => l.id === link.id);
          if (original && (original.platform !== link.platform || original.handle !== link.handle)) {
            await apiFetch(`/users/me/social-links/${link.id}`, {
              method: "PATCH",
              body: JSON.stringify({ platform: link.platform, handle: link.handle }),
            });
          }
        }
      }

      const changes: { username?: string; password?: string; bio?: string | null; visibility?: Visibility } = {};
      if (username !== user.username) changes.username = username;
      if (password) changes.password = password;
      if (bio !== (user.bio ?? "")) changes.bio = bio || null;
      if (visibility !== user.visibility) changes.visibility = visibility;

      const updated =
        Object.keys(changes).length > 0
          ? await apiFetch<PublicUser>("/users/me", { method: "PATCH", body: JSON.stringify(changes) })
          : await apiFetch<PublicUser>("/auth/me");

      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await apiFetch("/users/me", { method: "DELETE" });
      await logout();
      navigate("/login");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong");
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-baloo text-lg font-bold">Edit profile</h2>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-raised">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" role="img" aria-label={username}>
              <UserRound className="h-6 w-6 text-muted" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <label className="cursor-pointer text-xs font-medium text-accent-light">
            {isUploadingAvatar ? "Uploading…" : "Upload new file"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingAvatar}
              onChange={(e) => void handleAvatarUpload(e)}
            />
          </label>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => void handleRemoveAvatar()}
              className="text-xs text-destructive transition-opacity hover:opacity-80"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        className="input-surface rounded-lg px-3 py-2.5 text-sm text-text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        minLength={3}
        maxLength={20}
        required
      />
      <input
        className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
        type="password"
        placeholder="Leave blank to keep current password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
      />

      <div className="flex flex-col gap-1">
        <textarea
          rows={2}
          value={bio}
          maxLength={BIO_MAX_LENGTH}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          className="input-surface w-full break-words rounded-lg px-3 py-2 text-sm text-text placeholder:text-placeholder"
        />
        <span className="text-xs text-muted">{BIO_MAX_LENGTH - bio.length} characters remaining</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted">Social links</p>
        {links.map((link) => (
          <div key={link.id} className="flex gap-2">
            <div className="w-36 shrink-0">
              <SocialPlatformSelect value={link.platform} onChange={(platform) => updateLink(link.id, { platform })} />
            </div>
            <input
              className="input-surface flex-1 rounded-lg px-3 py-2 text-sm text-text placeholder:text-placeholder"
              placeholder="Handle"
              value={link.handle}
              onChange={(e) => updateLink(link.id, { handle: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeLink(link)}
              aria-label="Remove social link"
              className="px-1 text-muted hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLink}
          className="self-start text-xs font-medium text-accent-light transition-colors hover:text-accent"
        >
          + Add platform
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-visibility" className="text-xs text-muted">
          Privacy
        </label>
        <VisibilitySelect id="profile-visibility" value={visibility} onChange={setVisibility} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted transition-colors hover:text-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold text-accent-foreground transition-transform hover:scale-105 disabled:opacity-50"
        >
          Save changes
        </button>
      </div>

      <hr className="my-1 border-subtle" />

      {isConfirmingDelete ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text">
            Delete your account? This permanently removes your profile, library, and social links.
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted transition-colors hover:text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
              className="flex-1 rounded-full bg-destructive py-2.5 font-baloo text-sm font-bold text-white transition-transform hover:scale-105 disabled:opacity-50"
            >
              Yes, delete account
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          className="self-start text-sm font-medium text-destructive transition-opacity hover:opacity-80"
        >
          Delete account
        </button>
      )}
    </form>
  );
}
