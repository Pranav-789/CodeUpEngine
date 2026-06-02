import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { api } from "../services/api";
import { toast } from "react-toastify";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put("/auth/forgot-password", { email });
      setIsSent(true);
      toast.success("Password reset link sent to your email");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6 text-primary">
          <BrainCircuit size={48} />
        </div>
        
        {isSent ? (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>. 
              Please check your inbox and click the link to reset your password.
            </p>
            <Link 
              to="/login"
              className="block w-full bg-primary text-primary-foreground p-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
            <p className="text-center text-muted-foreground mb-8 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
