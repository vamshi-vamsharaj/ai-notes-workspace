// frontend/src/services/auth.service.ts
import { supabase } from "@/lib/supabase";
import type { User } from "@/types/auth.types";

export interface AuthResult {
  user: User | null;
  error: string | null;
}

class AuthService {
  /**
   * Sign up a new user.
   * We store `name` in Supabase's user_metadata so it travels with the JWT.
   */
  async signup(email: string, password: string, name: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return { user: null, error: this.formatError(error.message) };
    }

    if (!data.user) {
      return { user: null, error: "Signup failed. Please try again." };
    }

    return {
      user: this.mapSupabaseUser(data.user),
      error: null,
    };
  }

  /**
   * Log in an existing user.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
console.log("LOGIN DATA:", data)
console.log("LOGIN ERROR:", error)
    if (error) {
      return { user: null, error: this.formatError(error.message) };
    }

    if (!data.user) {
      return { user: null, error: "Login failed. Please try again." };
    }

    return {
      user: this.mapSupabaseUser(data.user),
      error: null,
    };
  }

  /**
   * Log out the current user.
   * Supabase clears the local session automatically.
   */
  async logout(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error ? this.formatError(error.message) : null };
  }

  /**
   * Get the current session. Used on app initialization.
   */
  async getSession(): Promise<AuthResult> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return { user: null, error: null }; // No session is not an error
    }

    return {
      user: this.mapSupabaseUser(data.session.user),
      error: null,
    };
  }

  /**
   * Get the current JWT token for API calls.
   */
  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  /**
   * Map Supabase's user object to our clean User type.
   */
  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split("@")[0] ?? "User",
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      created_at: supabaseUser.created_at,
    };
  }

  /**
   * Convert Supabase error messages to human-friendly strings.
   */
  private formatError(message: string): string {
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password. Please try again.",
      "Email not confirmed": "Please verify your email before logging in.",
      "User already registered": "An account with this email already exists.",
      "Password should be at least 6 characters": "Password must be at least 6 characters.",
      "Unable to validate email address: invalid format": "Please enter a valid email address.",
    };

    return errorMap[message] ?? message;
  }
}

export const authService = new AuthService();