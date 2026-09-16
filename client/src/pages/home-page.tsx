import { useAuth } from "../hooks/use-auth";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-text">
      <h1 className="text-xl font-bold">Logged in as {user?.username}</h1>
      <p className="text-sm text-muted">Profile page comes together in Phase 7.</p>
      <button
        onClick={() => void logout()}
        className="rounded-full bg-accent-gradient px-6 py-2 text-sm font-medium text-accent-foreground transition-colors"
      >
        LOG OUT
      </button>
    </main>
  );
}
