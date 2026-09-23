import { useState, type ChangeEvent, type FormEvent } from "react";
import { UserRound, X } from "lucide-react";
import type { PublicUser, SocialLink } from "shared";
import { apiFetch, ApiError } from "../lib/api";
import { uploadFile } from "../lib/upload";
import { SOCIAL_PLATFORM_OPTIONS } from "../lib/social-platforms";
import { Modal } from "./modal";
import { SocialPlatformSelect } from "./social-platform-select";

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
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [links, setLinks] = useState<LinkRow[]>(user.socialLinks.map((link) => ({ ...link })));
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
    setLinks((prev) => [...prev, { id: crypto.randomUUID(), platform: SOCIAL_PLATFORM_OPTIONS[0], handle: "", isNew: true }]);
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

      const changes: { username?: string; password?: string } = {};
      if (username !== user.username) changes.username = username;
      if (password) changes.password = password;

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
            <button type="button" onClick={() => void handleRemoveAvatar()} className="text-xs text-destructive">
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
        <button type="button" onClick={addLink} className="self-start text-xs font-medium text-accent-light">
          + Add platform
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-subtle py-2.5 font-baloo text-sm font-bold text-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold text-accent-foreground disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}
