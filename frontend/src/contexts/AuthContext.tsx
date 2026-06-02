import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

interface User {
  _id: string;
  email: string;
  codeforcesHandle: string;
  baseTokens: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUserTokens: (tokens: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/me");
      if (res.data.success) {
        setUser(res.data.data.profile);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (data: any) => {
    try {
      const res = await api.post("/auth/login", data);
      if (res.data.success) {
        if (res.data.data.accessToken) {
          localStorage.setItem("accessToken", res.data.data.accessToken);
        }
        await fetchProfile();
        toast.success("Logged in successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post("/auth/register", data);
      if (res.data.success) {
        toast.success("Registered successfully. Please verify your email.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
      toast.info("Logged out");
    }
  };

  const updateUserTokens = (tokens: number) => {
    if (user) {
      setUser({ ...user, baseTokens: tokens });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, updateUserTokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
