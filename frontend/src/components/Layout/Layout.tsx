import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Coins, LogOut, LayoutDashboard, BrainCircuit } from "lucide-react";

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Recommendations", path: "/recommendations", icon: <BrainCircuit size={20} /> },
  ];

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:h-screen overflow-y-auto border-b md:border-b-0 md:border-r border-border p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="font-bold text-2xl mb-8 flex items-center gap-2 text-primary">
            <BrainCircuit size={28} />
            CodeUpEngine
          </div>
          
          <div className="mb-6 bg-muted p-4 rounded-xl flex items-center justify-between border border-border">
            <div>
              <p className="text-sm text-muted-foreground">Token Balance</p>
              <p className="font-semibold text-lg">{user?.baseTokens ?? 0}</p>
            </div>
            <Coins className="text-yellow-500" size={28} />
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-4">
          <div className="mb-4">
            <p className="text-sm font-medium">{user?.codeforcesHandle}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
