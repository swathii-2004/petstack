import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";
import axios from "axios";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      logout: async () => {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/logout`,
            {},
            { withCredentials: true }
          );
        } catch {
          // Even if server call fails, clear local state
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);