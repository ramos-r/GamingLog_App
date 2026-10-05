import { UserRound } from "lucide-react";

interface AvatarProps {
  url: string | null;
  username: string;
  className?: string;
}

// Circle sized by the caller (e.g. "h-20 w-20"); shows the placeholder icon
// whenever there's no image.
export function Avatar({ url, username, className = "h-10 w-10" }: AvatarProps) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-surface-raised ${className}`}>
      {url ? (
        <img src={url} alt={username} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" role="img" aria-label={username}>
          <UserRound className="h-1/2 w-1/2 text-muted" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
