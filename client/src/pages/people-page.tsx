import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { UserSearchResult } from "shared";
import { apiFetch } from "../lib/api";
import { TopNav } from "../components/top-nav";
import { Avatar } from "../components/avatar";

// The outcome of one search, tagged with the term it was for so results for
// an older term are never shown against what's currently typed.
type SearchState =
  | { term: string; status: "loading" }
  | { term: string; status: "done"; results: UserSearchResult[] }
  | { term: string; status: "error" };

export function PeoplePage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState | null>(null);
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;

    let ignore = false;
    const timeout = setTimeout(() => {
      setState({ term, status: "loading" });
      apiFetch<UserSearchResult[]>(`/users?search=${encodeURIComponent(term)}`)
        .then((results) => {
          if (!ignore) setState({ term, status: "done", results });
        })
        .catch(() => {
          if (!ignore) setState({ term, status: "error" });
        });
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [term]);

  const current = state && state.term === term ? state : null;

  let message: string | null = null;
  if (term.length < 2) {
    message = "Type at least 2 letters to search.";
  } else if (!current || current.status === "loading") {
    message = "Searching…";
  } else if (current.status === "error") {
    message = "Something went wrong. Please try again.";
  } else if (current.results.length === 0) {
    message = "No one found.";
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-text">
      <TopNav />

      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-8 sm:px-8">
        <h1 className="font-baloo text-xl font-bold">Find people</h1>

        <div className="relative">
          <label htmlFor="people-search" className="sr-only">
            Search people by username
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="people-search"
            autoFocus
            value={query}
            maxLength={20}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            autoComplete="off"
            className="input-surface w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-placeholder"
          />
        </div>

        <div aria-live="polite">
          {message && <p className="text-sm text-muted">{message}</p>}
          {term.length >= 2 && current?.status === "done" && current.results.length > 0 && (
            <ul className="flex flex-col gap-2">
              {current.results.map((result) => (
                <li key={result.username}>
                  <Link
                    to={`/u/${encodeURIComponent(result.username)}`}
                    className="flex items-center gap-3 rounded-lg bg-surface p-3 transition-colors hover:bg-surface-raised"
                  >
                    <Avatar url={result.avatarUrl} username={result.username} className="h-10 w-10" />
                    <span className="min-w-0 break-all font-baloo text-sm font-medium">{result.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
