import { useEffect, useRef, useState } from "react";
import { Share2, X } from "lucide-react";
import type { Visibility } from "shared";

interface ShareProfileButtonProps {
  username: string;
  visibility: Visibility;
}

type PopoverState = { kind: "closed" } | { kind: "copied" } | { kind: "manual"; url: string };

const VISIBILITY_NOTES: Record<Visibility, string | null> = {
  PUBLIC: null,
  FRIENDS: "Only your friends will see your full profile.",
  PRIVATE: "Your profile is private — people opening the link will only see your username.",
};

export function ShareProfileButton({ username, visibility }: ShareProfileButtonProps) {
  const [popover, setPopover] = useState<PopoverState>({ kind: "closed" });
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function clearTimer() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }

  async function handleClick() {
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
    clearTimer();
    try {
      await navigator.clipboard.writeText(url);
      setPopover({ kind: "copied" });
      timer.current = window.setTimeout(() => setPopover({ kind: "closed" }), 3000);
    } catch {
      // No clipboard access (permissions, insecure context): show the link so
      // it can be copied by hand. It stays until dismissed.
      setPopover({ kind: "manual", url });
    }
  }

  function close() {
    clearTimer();
    setPopover({ kind: "closed" });
  }

  const note = VISIBILITY_NOTES[visibility];

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <button
        type="button"
        onClick={() => void handleClick()}
        className="flex items-center gap-1.5 rounded-full border border-subtle px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Share
      </button>

      {/* The live region stays mounted so screen readers announce its content. */}
      <div role="status" className="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)]">
        {popover.kind !== "closed" && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-subtle bg-surface-raised p-3 text-xs shadow-xl">
            <div className="flex items-start justify-between gap-2">
              {popover.kind === "copied" ? (
                <p className="font-medium text-text">Link copied!</p>
              ) : (
                <p className="font-medium text-text">Copy this link:</p>
              )}
              {popover.kind === "manual" && (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="text-muted transition-colors hover:text-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {popover.kind === "manual" && <p className="select-all break-all text-text">{popover.url}</p>}
            {note && <p className="text-muted">{note}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
