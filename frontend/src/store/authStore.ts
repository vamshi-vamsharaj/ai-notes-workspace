import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import type { AuthStore } from "@/types/auth.types";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ─────────────────────────────────────────────
      // STATE
      // ─────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // ─────────────────────────────────────────────
      // INITIALIZE AUTH
      // ─────────────────────────────────────────────
      initializeAuth: async () => {
        try {
          console.log("INIT AUTH START");

          set({
            isLoading: true,
          });

          // Restore session
          const result =
            await authService.getSession();

          console.log(
            "SESSION RESULT:",
            result
          );

          set({
            user: result.user,
            isAuthenticated: !!result.user,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

          // Listen for auth changes
          supabase.auth.onAuthStateChange(
            async (_event, session) => {

              console.log(
                "AUTH EVENT:",
                _event,
                session
              );

              // Session exists
              if (session?.user) {

                const mappedUser = {
                  id: session.user.id,

                  email:
                    session.user.email ?? "",

                  name:
                    session.user.user_metadata
                      ?.name ??
                    session.user.email?.split(
                      "@"
                    )[0] ??
                    "User",

                  avatar_url:
                    session.user.user_metadata
                      ?.avatar_url ?? null,

                  created_at:
                    session.user.created_at,
                };

                set({
                  user: mappedUser,
                  isAuthenticated: true,
                  isInitialized: true,
                  isLoading: false,
                  error: null,
                });

                return;
              }

              // No session
              set({
                user: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
            }
          );
        } catch (err: any) {

          console.error(
            "AUTH INIT ERROR:",
            err
          );

          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error:
              err?.message ??
              "Failed to initialize auth",
          });
        }
      },

      // ─────────────────────────────────────────────
      // LOGIN
      // ─────────────────────────────────────────────
      login: async (
        email: string,
        password: string
      ) => {
        try {

          set({
            isLoading: true,
            error: null,
          });

          const {
            user,
            error,
          } = await authService.login(
            email,
            password
          );

          if (error) {

            set({
              error,
              isLoading: false,
            });

            return;
          }

          set({
            user,
            isAuthenticated: !!user,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

        } catch (err: any) {

          set({
            error:
              err?.message ??
              "Login failed",

            isLoading: false,
          });
        }
      },

      // ─────────────────────────────────────────────
      // SIGNUP
      // ─────────────────────────────────────────────
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

          const {
            user,
            error,
          } = await authService.signup(
            email,
            password,
            name
          );

          if (error) {

            set({
              error,
              isLoading: false,
            });

            return;
          }

          set({
            user,
            isAuthenticated: !!user,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

        } catch (err: any) {

          set({
            error:
              err?.message ??
              "Signup failed",

            isLoading: false,
          });
        }
      },

      // ─────────────────────────────────────────────
      // LOGOUT
      // ─────────────────────────────────────────────
      logout: async () => {
        try {

          set({
            isLoading: true,
          });

          await authService.logout();

          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: null,
          });

        } catch (err: any) {

          set({
            error:
              err?.message ??
              "Logout failed",

            isLoading: false,
          });
        }
      },

      // ─────────────────────────────────────────────
      // CLEAR ERROR
      // ─────────────────────────────────────────────
      clearError: () =>
        set({
          error: null,
        }),
    }),

    {
      name: "peblo-auth-store",

      storage: createJSONStorage(
        () => localStorage
      ),

      partialize: (state) => ({
        user: state.user,
        isAuthenticated:
          state.isAuthenticated,
      }),
    }
  )
);