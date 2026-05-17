import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

import { AppLayout } from "@/components/layout/AppLayout";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";

import { DashboardPage } from "@/pages/DashboardPage";
import { NotesPage } from "@/pages/NotesPage";
import { NoteEditorPage } from "@/pages/NoteEditorPage";
import { AIInsightsPage } from '@/pages/AIInsightsPage'
import { SharedNotePage } from '@/pages/SharedNotePage'
function App() {

  const initializeAuth =
    useAuthStore(
      (state) => state.initializeAuth
    );

  const isInitialized =
    useAuthStore(
      (state) => state.isInitialized
    );

  useEffect(() => {

    initializeAuth();

    // IMPORTANT:
    // empty dependency array
    // prevents infinite auth loops

  }, []);

  // Wait for auth hydration
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <BrowserRouter>

      <Routes>

        {/* PUBLIC */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />

        {/* PROTECTED */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes/archived"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NoteEditorPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
        <Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <AppLayout>
        <AIInsightsPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

{/* PUBLIC SHARED NOTE — NO auth, NO AppLayout */}
<Route
  path="/shared/:token"
  element={<SharedNotePage />}
/>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;