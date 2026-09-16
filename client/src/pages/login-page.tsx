import { AuthCard } from "../components/auth-card";

export function LoginPage() {
  return (
    <main className="auth-background flex min-h-screen items-center justify-center p-4">
      <AuthCard mode="login" />
    </main>
  );
}
