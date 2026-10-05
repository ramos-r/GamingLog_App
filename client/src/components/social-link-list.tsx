import type { SocialLink } from "shared";
import { SocialPlatformIcon } from "./social-platform-icon";

interface SocialLinkListProps {
  links: SocialLink[];
}

// Static version of the profile's social links — someone else's profile can't
// be reordered, unlike SortableSocialLinks on your own.
export function SocialLinkList({ links }: SocialLinkListProps) {
  if (links.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={link.id} className="flex items-center gap-1.5 px-1 text-xs text-muted">
          <SocialPlatformIcon platform={link.platform} className="h-4 w-4 shrink-0" />
          {link.handle}
        </li>
      ))}
    </ul>
  );
}
