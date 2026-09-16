import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { ApiError } from "../lib/api";

interface AuthCardProps {
  mode: "login" | "register";
}

export function AuthCard({ mode }: AuthCardProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
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
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-subtle bg-surface/70 p-8 shadow-2xl backdrop-blur-sm">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted">{mode === "login" ? "welcome to your" : "create your"}</p>
        <h1 className="bg-accent-gradient bg-clip-text text-3xl font-bold text-transparent">Gaming Log</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
        {mode === "register" && (
          <input
            className="input-surface rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted"
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
          className="mt-2 rounded-full bg-accent-gradient py-2.5 text-sm font-semibold tracking-wide text-accent-foreground transition-colors disabled:opacity-50"
        >
          {mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}
        </button>

        <p className="text-center text-xs text-muted">or</p>

        {mode === "login" ? (
          <Link
            to="/register"
            className="rounded-full border border-subtle py-2.5 text-center text-sm font-semibold tracking-wide text-muted transition-colors hover:text-text"
          >
            CREATE ACCOUNT
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-full border border-subtle py-2.5 text-center text-sm font-semibold tracking-wide text-muted transition-colors hover:text-text"
          >
            LOG IN
          </Link>
        )}
      </form>
    </div>
  );
}
