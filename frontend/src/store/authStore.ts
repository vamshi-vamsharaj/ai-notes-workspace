// frontend/src/store/authStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";

import type { AuthStore } from "@/types/auth.types";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ─────────────────────────────────────────────────────────────
      // State
      // ─────────────────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // ─────────────────────────────────────────────────────────────
      // Initialize Auth
      // ─────────────────────────────────────────────────────────────
      initializeAuth: async () => {
        try {
          set({ isLoading: true });

          // Restore existing session
          const { user } = await authService.getSession();

          set({
            user,
            isAuthenticated: !!user,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

          // Listen for auth state changes
          supabase.auth.onAuthStateChange((event, session) => {
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

              set({
                user: mappedUser,
                isAuthenticated: true,
                error: null,
              });
            }

            if (event === "SIGNED_OUT") {
              set({
                user: null,
                isAuthenticated: false,
                error: null,
              });
            }
          });
        } catch (err) {
          console.error("Auth initialization failed:", err);

          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: "Failed to initialize authentication",
          });
        }
      },

      // ─────────────────────────────────────────────────────────────
      // Login
      // ─────────────────────────────────────────────────────────────
      login: async (email: string, password: string) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const { user, error } = await authService.login(
            email,
            password
          );

          if (error) {
            set({
              isLoading: false,
              error,
            });

            return;
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          console.error("Login failed:", err);

          set({
            isLoading: false,
            error: "Something went wrong during login",
          });
        }
      },

      // ─────────────────────────────────────────────────────────────
      // Signup
      // ─────────────────────────────────────────────────────────────
      signup: async (
        email: string,
        password: string,
        name: string
      ) => {
        try {
          set({
            isLoading: true,
            error: null,
          });

          const { user, error } =
            await authService.signup(email, password, name);

          if (error) {
            set({
              isLoading: false,
              error,
            });

            return;
          }

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          console.error("Signup failed:", err);

          set({
            isLoading: false,
            error: "Something went wrong during signup",
          });
        }
      },

      // ─────────────────────────────────────────────────────────────
      // Logout
      // ─────────────────────────────────────────────────────────────
      logout: async () => {
        try {
          set({
            isLoading: true,
          });

          await authService.logout();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          console.error("Logout failed:", err);

          set({
            isLoading: false,
            error: "Failed to logout",
          });
        }
      },

      // ─────────────────────────────────────────────────────────────
      // Clear Error
      // ─────────────────────────────────────────────────────────────
      clearError: () => {
        set({
          error: null,
        });
      },
    }),
    {
      name: "ai-notes-auth-store",

      storage: createJSONStorage(() => localStorage),

      // Persist only essential auth state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);