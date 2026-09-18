import { useEffect, useState, type ReactNode } from "react";
import type { LoginInput, PublicUser, RegisterInput } from "shared";
import { apiFetch } from "./api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<PublicUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(input: LoginInput) {
    const nextUser = await apiFetch<PublicUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUser(nextUser);
  }

  async function register(input: RegisterInput) {
    const nextUser = await apiFetch<PublicUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setUser(nextUser);
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
