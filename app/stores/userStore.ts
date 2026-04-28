import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  userType: string;
  credits: number;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isFetching: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (code: string, codeVerifier: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUser: () => void;
}

const API_BASE = import.meta.env.DEV ? "http://localhost:8787" : "https://api.tuziyo.com";

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isFetching: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: async (code: string, codeVerifier: string) => {
        try {
          const response = await fetch(`${API_BASE}/api/auth/google/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, code_verifier: codeVerifier }),
          });

          const data = await response.json();

          if (data.error) {
            return { success: false, error: data.message || data.error };
          }

          if (data.token && data.user) {
            set({ user: data.user, token: data.token, isLoading: false });
            return { success: true };
          }

          return { success: false, error: "Login failed" };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
        }
      },

      logout: async () => {
        try {
          const token = get().token;
          if (token) {
            await fetch(`${API_BASE}/api/auth/logout`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } finally {
          set({ user: null, token: null });
          localStorage.removeItem("user-storage");
          window.location.href = "/";
        }
      },

      fetchUser: () => {
        const state = get();
        if (state.isFetching) return;

        const stored = localStorage.getItem("tuziyo-user-storage");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token) {
              set({ token: parsed.state.token, isFetching: true });
              fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${parsed.state.token}` },
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.user) {
                    set({ user: data.user, isFetching: false });
                  } else {
                    set({ user: null, token: null, isFetching: false });
                    localStorage.removeItem("tuziyo-user-storage");
                  }
                })
                .catch(() => {
                  set({ user: null, token: null, isFetching: false });
                  localStorage.removeItem("tuziyo-user-storage");
                });
              return;
            }
          } catch {
          }
        }
        set({ isLoading: false, isFetching: false });
      },
    }),
    {
      name: "tuziyo-user-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);