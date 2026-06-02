import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export interface Submission {
  problemId: string;
  rating: number;
  tags: string[];
  solvedAt: Date;
  correctSubmissions: number;
  incorrectSubmissions: number;
}

export interface Recommendation {
  problemId: string;
  recommendedAt: Date;
  targetTopic: string;
}

interface UserMetrics {
  recentSubmissions: Submission[];
  topicEloVector: number[];
  activeRecommendations: Recommendation[];
}

interface UserMetricsContextType {
  metrics: UserMetrics | null;
  loading: boolean;
  refreshMetrics: () => Promise<void>;
  syncProfile: () => Promise<void>;
  updateRecommendations: (newRecs: Recommendation[]) => void;
}

const UserMetricsContext = createContext<UserMetricsContextType | undefined>(undefined);

export const UserMetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get("/user/metrics");
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const syncProfile = async () => {
    try {
      const res = await api.post("/sync");
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      throw err;
    }
  };

  const updateRecommendations = (newRecs: Recommendation[]) => {
    if (metrics) {
      setMetrics({ ...metrics, activeRecommendations: newRecs });
    }
  };

  return (
    <UserMetricsContext.Provider
      value={{ metrics, loading, refreshMetrics: fetchMetrics, syncProfile, updateRecommendations }}
    >
      {children}
    </UserMetricsContext.Provider>
  );
};

export const useUserMetrics = () => {
  const context = useContext(UserMetricsContext);
  if (context === undefined) {
    throw new Error("useUserMetrics must be used within a UserMetricsProvider");
  }
  return context;
};
