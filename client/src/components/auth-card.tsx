import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { ApiError } from "../lib/api";
import { loginUrlFor, safeRedirect } from "../lib/safe-redirect";

interface AuthCardProps {
  mode: "login" | "register";
}

export function AuthCard({ mode }: AuthCardProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  // Where to go after logging in (set when a logged-out visitor hit a page
  // that needed it); validated so it can't be used as an open redirect.
  const redirectTo = safeRedirect(useSearchParams()[0].get("redirect"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login({ username, password });
      } else {
        await register({ username, password });
      }
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-noise w-full max-w-sm rounded-2xl border border-subtle bg-surface/35 p-8 shadow-2xl backdrop-blur-md">
      <div className="mb-6 text-center leading-tight">
        <p className="text-sm text-muted">{mode === "login" ? "welcome to your" : "create your"}</p>
        <h1 className="-mt-0.5 bg-accent-gradient bg-clip-text font-baloo text-3xl font-bold text-transparent">
          Gaming Log
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
        {mode === "register" && (
          <input
            className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-placeholder"
            placeholder="confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-full bg-accent-gradient py-2.5 font-baloo text-sm font-bold tracking-wide text-accent-foreground transition-transform hover:scale-105 disabled:opacity-50"
        >
          {mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}
        </button>

        <p className="text-center text-xs text-muted">or</p>

        {mode === "login" ? (
          <Link
            to={loginUrlFor(redirectTo, "register")}
            className="rounded-full border border-subtle py-2.5 text-center font-baloo text-sm font-bold tracking-wide text-muted transition-colors hover:text-text"
          >
            CREATE ACCOUNT
          </Link>
        ) : (
          <Link
            to={loginUrlFor(redirectTo, "login")}
            className="rounded-full border border-subtle py-2.5 text-center font-baloo text-sm font-bold tracking-wide text-muted transition-colors hover:text-text"
          >
            LOG IN
          </Link>
        )}
      </form>
    </div>
  );
}
