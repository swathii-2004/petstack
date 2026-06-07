import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

/**
 * Lightweight auth store — with Clerk, the token is obtained on-the-fly via
 * `useAuth().getToken()`.  We still cache the backend user profile here so
 * other parts of the UI can access name/role/status without extra requests.
 */
interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
    }),
    {
      name: "user-auth-storage",
      version: 1
    }
  )
);