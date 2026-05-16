// frontend/src/types/auth.types.ts

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Has the auth check on app load completed?
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}