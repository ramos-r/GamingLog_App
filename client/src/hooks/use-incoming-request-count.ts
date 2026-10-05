import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { FriendRequestCount } from "shared";
import { apiFetch } from "../lib/api";
import { FRIENDS_CHANGED_EVENT } from "../lib/friends-events";

// Number of friend requests waiting for the logged-in user. Refetched when the
// page changes and whenever a friendship changes anywhere in the app.
export function useIncomingRequestCount(enabled: boolean): number {
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let ignore = false;
    function load() {
      apiFetch<FriendRequestCount>("/friends/requests/count")
        .then((result) => {
          if (!ignore) setCount(result.incoming);
        })
        .catch(() => {
          // The badge is a convenience; a failed fetch just leaves it as it was.
        });
    }

    load();
    window.addEventListener(FRIENDS_CHANGED_EVENT, load);
    return () => {
      ignore = true;
      window.removeEventListener(FRIENDS_CHANGED_EVENT, load);
    };
  }, [enabled, pathname]);

  return enabled ? count : 0;
}
