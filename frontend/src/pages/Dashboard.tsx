import React, { useMemo, useState } from "react";
import { useUserMetrics } from "../contexts/UserMetricsContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";

// Mapping of 38 indices to general CP topics
const TOPICS = [
  "implementation", "math", "greedy", "dp", "data structures",
  "brute force", "constructive algorithms", "graphs", "sortings",
  "binary search", "dfs and similar", "trees", "strings",
  "number theory", "combinatorics", "geometry", "bitmasks",
  "two pointers", "dsu", "shortest paths", "probabilities",
  "divide and conquer", "hashing", "games", "flows", "interactive",
  "matrices", "string suffix structures", "fft", "graph matchings",
  "ternary search", "expression parsing", "meet-in-the-middle",
  "2-sat", "chinese remainder theorem", "schedules",
  "*special", "Unknown"
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { metrics, loading, syncProfile } = useUserMetrics();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncProfile();
      toast.success("Profile synced successfully (cost: 10 tokens)");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to sync profile");
    } finally {
      setIsSyncing(false);
    }
  };

  const radarData = useMemo(() => {
    if (!metrics?.topicEloVector) return [];
    // We map only the top 10 topics by rating to avoid a cluttered radar chart
    const fullData = metrics.topicEloVector.map((rating, index) => ({
      topic: TOPICS[index] || `Topic ${index}`,
      rating: Math.round(rating),
    }));
    return fullData.sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [metrics?.topicEloVector]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
          Sync Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[420px]">
          <h2 className="text-xl font-semibold mb-4 shrink-0">Topic Elo Ratings</h2>
          <div className="flex-1 w-full min-h-0">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 200']} />
                  <Radar
                    name={user?.codeforcesHandle}
                    dataKey="rating"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No topic data available
              </div>
            )}
          </div>
        </div>

        {/* Active Recommendations Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[420px]">
          <h2 className="text-xl font-semibold mb-4 shrink-0">Active ML Recommendations</h2>
          {metrics?.activeRecommendations && metrics.activeRecommendations.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {metrics.activeRecommendations.map((rec) => (
                <a
                  key={rec.problemId}
                  href={`https://codeforces.com/problemset/problem/${rec.problemId.split("-")[0]}/${rec.problemId.split("-")[1]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors group shrink-0"
                >
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      Problem {rec.problemId}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Focus: {rec.targetTopic}
                    </p>
                  </div>
                  <ExternalLink size={18} className="text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground min-h-0">
              No active recommendations.
            </div>
          )}
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Recent Unique Problem Attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Problem ID</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Solved At</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recentSubmissions?.slice(0, 10).map((sub) => (
                <tr key={sub.problemId} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{sub.problemId}</td>
                  <td className="px-6 py-4">{sub.rating || "N/A"}</td>
                  <td className="px-6 py-4">
                    {sub.solvedAt ? new Date(sub.solvedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 flex justify-center">
                    {sub.correctSubmissions > 0 ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!metrics?.recentSubmissions || metrics.recentSubmissions.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">
              No recent submissions found. Try syncing your profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
