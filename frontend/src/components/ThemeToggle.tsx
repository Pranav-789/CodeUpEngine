import React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-lg border border-border bg-background p-1 gap-1">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light" 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark" 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "system" 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="System Preference"
      >
        <Laptop size={16} />
      </button>
    </div>
  );
};
