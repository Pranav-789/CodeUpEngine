import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BrainCircuit, Target, Zap, LayoutDashboard } from "lucide-react";

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <BrainCircuit size={32} />
          <span className="text-xl font-bold tracking-tight text-foreground">CodeUpEngine</span>
        </div>
        <nav>
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <LayoutDashboard size={18} />
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex gap-4 items-center">
              <Link to="/login" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center">
        <section className="w-full max-w-6xl mx-auto px-4 py-24 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20">
            <Zap size={16} />
            <span className="text-sm font-semibold tracking-wide">AI-Powered Problem Recommendations</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Master Competitive <br />
            Programming <span className="text-primary bg-clip-text">Faster.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            CodeUpEngine uses advanced Machine Learning to analyze your Codeforces history and recommend the exact problems you need to solve to maximize your rating growth. Stop wasting time on problems that are too easy or impossibly hard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Access Your Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  Start Training Now
                </Link>
                <Link 
                  to="/login" 
                  className="bg-card text-foreground border border-border px-8 py-4 rounded-xl font-bold text-lg hover:bg-border/50 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="w-full max-w-7xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for Peak Performance</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A sleek, distraction-free environment that gives you deep insights into your problem-solving metrics and serves up highly curated ML recommendations.
            </p>
          </div>

          <div className="flex flex-col gap-24">
            {/* Dashboard Feature */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4 border border-primary/30">
                  <Target size={24} />
                </div>
                <h3 className="text-3xl font-bold">Comprehensive Analytics Dashboard</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Track your rating, review your recent submission accuracy, and visualize your progress across different problem ratings. CodeUpEngine seamlessly syncs your peer group data to baseline your performance.
                </p>
              </div>
              <div className="flex-[1.5] w-full">
                <div className="rounded-2xl border border-border/50 bg-card/50 p-2 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <img 
                    src="/images/dashboard.png" 
                    alt="Dashboard Screenshot" 
                    className="w-full h-auto rounded-xl shadow-lg border border-border/30 transform transition-transform duration-700 hover:scale-[1.01]"
                  />
                </div>
              </div>
            </div>

            {/* Recommendations Feature */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/30">
                  <BrainCircuit size={24} />
                </div>
                <h3 className="text-3xl font-bold">ML-Driven Recommendations</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our custom K-Nearest Neighbors engine analyzes hundreds of similar coders to identify the exact problems that helped them rank up. You get a curated, dynamic list of actionable problems mapped to your aspirational skill tier.
                </p>
              </div>
              <div className="flex-[1.5] w-full">
                <div className="rounded-2xl border border-border/50 bg-card/50 p-2 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <img 
                    src="/images/recommendations.png" 
                    alt="Recommendations Screenshot" 
                    className="w-full h-auto rounded-xl shadow-lg border border-border/30 transform transition-transform duration-700 hover:scale-[1.01]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-muted-foreground mt-auto">
        <div className="flex items-center justify-center gap-2 mb-4 text-foreground opacity-80">
          <BrainCircuit size={20} />
          <span className="font-semibold">CodeUpEngine</span>
        </div>
        <p>&copy; {new Date().getFullYear()} CodeUpEngine. All rights reserved.</p>
      </footer>
    </div>
  );
};
