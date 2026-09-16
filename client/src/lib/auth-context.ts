import { createContext } from "react";
import type { LoginInput, PublicUser, RegisterInput } from "shared";

export interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
