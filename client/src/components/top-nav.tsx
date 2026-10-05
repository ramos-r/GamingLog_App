import { Link, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { loginUrlFor } from "../lib/safe-redirect";

const linkClass = "flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-text";

// Shown on every logged-in page and on /u/:username.
export function TopNav() {
  const { user, logout } = useAuth();
  const location = useLocation();

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
