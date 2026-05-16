// frontend/src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { LoginFormData } from "@/types/auth.types";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated]);

  useEffect(() => {
    return () => clearError();
  }, []);

  const validate = (): boolean => {
    const errors: Partial<LoginFormData> = {};
    if (!formData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Enter a valid email";
    if (!formData.password) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen bg-[#07070d] flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#0d0d1a] to-[#07070d] border-r border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-semibold tracking-tight">Peblo AI Notes</span>
        </div>

        <div>
          <blockquote className="text-3xl font-light text-white/80 leading-relaxed mb-6">
            "Your thoughts, organized.
            <br />
            Your ideas, amplified."
          </blockquote>
          <div className="flex gap-4">
            {["AI Summaries", "Action Items", "Smart Search"].map((tag) => (
              <span
                key={tag}
                className="text-xs text-violet-400 border border-violet-500/30 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-sm">© 2026 Peblo · Built for clarity</p>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-violet-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-white font-semibold">Peblo AI Notes</span>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight">
            Welcome back
          </h1>
          <p className="text-white/40 text-sm mb-8">Sign in to your workspace</p>

          {/* Global error */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, email: e.target.value }));
                  setFormErrors((p) => ({ ...p, email: undefined }));
                  clearError();
                }}
                placeholder="you@example.com"
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-white/8 ${
                  formErrors.email ? "border-red-500/50" : "border-white/10"
                }`}
              />
              {formErrors.email && (
                <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, password: e.target.value }));
                  setFormErrors((p) => ({ ...p, password: undefined }));
                  clearError();
                }}
                placeholder="••••••••"
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-white/8 ${
                  formErrors.password ? "border-red-500/50" : "border-white/10"
                }`}
              />
              {formErrors.password && (
                <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-all duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;