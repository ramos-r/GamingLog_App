import { Link, useLocation } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useFriendsPanel } from "../hooks/use-friends-panel";
import { useIncomingRequestCount } from "../hooks/use-incoming-request-count";
import { FRIENDS_PANEL_ID, FRIENDS_TOGGLE_ID } from "../lib/friends-panel-context";
import { loginUrlFor } from "../lib/safe-redirect";

const linkClass = "flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-text";

// Shown on every logged-in page and on /u/:username.
export function TopNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isOpen, toggle } = useFriendsPanel();
  const pending = useIncomingRequestCount(Boolean(user));

  return (
    <nav aria-label="Main" className="flex items-center justify-between px-4 py-3 sm:px-8">
      <Link
        to="/"
        className="bg-accent-gradient bg-clip-text font-baloo text-lg font-bold text-transparent transition-opacity hover:opacity-80"
      >
        Gaming Log
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/people" aria-label="Find people" className={linkClass}>
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Find people</span>
            </Link>
            <button
              type="button"
              id={FRIENDS_TOGGLE_ID}
              onClick={toggle}
              aria-expanded={isOpen}
              aria-controls={FRIENDS_PANEL_ID}
              aria-label={pending > 0 ? `Friends, ${pending} pending ${pending === 1 ? "request" : "requests"}` : "Friends"}
              className={linkClass}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Friends</span>
              {pending > 0 && (
                <span
                  aria-hidden="true"
                  className="min-w-4 rounded-full bg-accent px-1.5 text-center text-[10px] font-bold leading-4 text-accent-foreground"
                >
                  {pending}
                </span>
              )}
            </button>
            <button type="button" onClick={() => void logout()} className={linkClass}>
              Log out
            </button>
          </>
        ) : (
          <Link to={loginUrlFor(location.pathname + location.search)} className={linkClass}>
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
