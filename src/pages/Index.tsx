import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, BookOpen, Users, TrendingUp, Shield, CheckCircle } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/select-society");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6 shadow-strong">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            CoopManager
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Complete Cooperative Society Management System for seamless financial operations
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-strong text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-medium hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Day Book Management</h3>
            <p className="text-white/80">
              Dual-column format with automatic balancing, voucher tracking, and daily cash reconciliation
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-medium hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Member Management</h3>
            <p className="text-white/80">
              Comprehensive member records, loan tracking, and detailed financial histories
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-medium hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Financial Reports</h3>
            <p className="text-white/80">
              Real-time ledgers, trial balance, P&L statements, and balance sheets
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-medium hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Maker-Checker Workflow</h3>
            <p className="text-white/80">
              Multi-level approval system with complete audit trail and role-based access
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-medium hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Society Support</h3>
            <p className="text-white/80">
              Manage multiple cooperative societies from one account with complete data isolation
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-medium hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Inventory Management</h3>
            <p className="text-white/80">
              Track stock movements, sales, purchases with FIFO/weighted average valuation
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 shadow-strong">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to streamline your cooperative society management?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join cooperative societies already using CoopManager for accurate, efficient, and secure financial operations
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-strong text-lg px-10 py-6"
              onClick={() => navigate("/auth")}
            >
              Start Free Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
