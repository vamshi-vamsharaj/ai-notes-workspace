// frontend/src/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import type { AuthStore } from "@/types/auth.types";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ─── State ────────────────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // ─── Actions ──────────────────────────────────────────────────────────

      /**
       * Called once on app startup (in App.tsx).
       * Restores session from localStorage and sets up auth listener.
       *
       * Why onAuthStateChange?
       * Supabase fires this whenever the token changes — login, logout,
       * token refresh, or another tab changes auth state. This keeps
       * all tabs in sync without polling.
       */
      initializeAuth: async () => {
        // Restore existing session
        const { user, error } = await authService.getSession();

        set({
          user,
          isAuthenticated: !!user,
          isInitialized: true,
          error: null,
        });

        // Listen for auth state changes (token refresh, other tabs, etc.)
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            const mappedUser = {
              id: session.user.id,
              email: session.user.email ?? "",
              name:
                session.user.user_metadata?.name ??
                session.user.email?.split("@")[0] ??
                "User",
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
            };
            set({ user: mappedUser, isAuthenticated: true });
          } else if (event === "SIGNED_OUT") {
            set({ user: null, isAuthenticated: false });
          } else if (event === "TOKEN_REFRESHED" && session?.user) {
            // Token was silently refreshed — no action needed, Supabase handles it
          }
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        const { user, error } = await authService.login(email, password);

        if (error) {
          set({ isLoading: false, error });
          return;
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });

        const { user, error } = await authService.signup(email, password, name);

        if (error) {
          set({ isLoading: false, error });
          return;
        }

        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      },

      logout: async () => {
        set({ isLoading: true });

        await authService.logout();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "peblo-auth-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist the user — don't persist loading/error states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);