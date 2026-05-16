// frontend/src/pages/DashboardPage.tsx
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-white">
      {/* Top Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-semibold tracking-tight">Peblo AI Notes</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-white">{user?.name}</p>
            <p className="text-xs text-white/40">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="text-sm text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5"
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-white mb-2">
            Good morning, <span className="text-violet-400">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-white/40">
            Phase 2 complete. Authentication is working. Ready for Phase 3 — Notes.
          </p>
        </div>

        {/* Placeholder cards for future phases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Notes", value: "—", color: "violet" },
            { label: "AI Summaries", value: "—", color: "emerald" },
            { label: "Action Items", value: "—", color: "amber" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/3 border border-white/8 rounded-xl p-6"
            >
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{label}</p>
              <p className="text-3xl font-light text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/3 border border-white/8 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-white/60 text-sm mb-1">No notes yet</p>
          <p className="text-white/30 text-xs">Notes CRUD coming in Phase 3</p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;