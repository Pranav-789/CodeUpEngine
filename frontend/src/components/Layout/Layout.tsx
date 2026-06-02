import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Coins, LogOut, LayoutDashboard, BrainCircuit } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

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
          <Link to="/" className="flex items-center gap-2 mb-8 text-primary px-2 hover:opacity-80 transition-opacity">
            <BrainCircuit size={28} />
            <span className="text-xl font-bold tracking-tight text-foreground">CodeUpEngine</span>
          </Link>
          
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

        <div className="p-4 border-t border-border flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.codeforcesHandle?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{user?.codeforcesHandle}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <ThemeToggle />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
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
