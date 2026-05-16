// frontend/src/pages/SignupPage.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { SignupFormData } from "@/types/auth.types";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isLoading, isAuthenticated, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<SignupFormData>>({});

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated]);

  useEffect(() => {
    return () => clearError();
  }, []);

  const validate = (): boolean => {
    const errors: Partial<SignupFormData> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Enter a valid email";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6) errors.password = "Minimum 6 characters";
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords don't match";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await signup(formData.email, formData.password, formData.name);
  };

  const updateField = (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    setFormErrors((p) => ({ ...p, [field]: undefined }));
    clearError();
  };

  const fields: {
    key: keyof SignupFormData;
    label: string;
    type: string;
    placeholder: string;
  }[] = [
    { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { key: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
    {
      key: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "••••••••",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07070d] flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-violet-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="text-white font-semibold">Peblo AI Notes</span>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight">
          Create your workspace
        </h1>
        <p className="text-white/40 text-sm mb-8">Start organizing your thoughts with AI</p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
                {label}
              </label>
              <input
                type={type}
                value={formData[key]}
                onChange={updateField(key)}
                placeholder={placeholder}
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all focus:border-violet-500/60 ${
                  formErrors[key] ? "border-red-500/50" : "border-white/10"
                }`}
              />
              {formErrors[key] && (
                <p className="text-red-400 text-xs mt-1">{formErrors[key]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition-all duration-200 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;