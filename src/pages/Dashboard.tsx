import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp,
  IndianRupee,
  Calendar,
  Building2,
  LogOut
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [society, setSociety] = useState<any>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    todayReceipts: 0,
    todayPayments: 0,
    cashBalance: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const societyId = localStorage.getItem("selectedSocietyId");
    if (!societyId) {
      navigate("/select-society");
      return;
    }

    await loadSociety(societyId);
    await loadStats(societyId);
  };

  const loadSociety = async (societyId: string) => {
    try {
      const { data, error } = await supabase
        .from("societies")
        .select("*")
        .eq("id", societyId)
        .single();

      if (error) throw error;
      setSociety(data);
    } catch (error: any) {
      toast.error("Failed to load society data");
    }
  };

  const loadStats = async (societyId: string) => {
    try {
      // Load members count
      const { count: membersCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("society_id", societyId)
        .eq("status", "active");

      setStats({
        totalMembers: membersCount || 0,
        todayReceipts: 0,
        todayPayments: 0,
        cashBalance: 0,
      });
    } catch (error: any) {
      toast.error("Failed to load statistics");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("selectedSocietyId");
    navigate("/auth");
  };

  const handleChangeSociety = () => {
    localStorage.removeItem("selectedSocietyId");
    navigate("/select-society");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {society?.name || "CoopManager"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {society?.registration_number || "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleChangeSociety}>
              Change Society
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary-light text-white shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/80 text-sm">
                Cash Balance
              </CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <IndianRupee className="h-6 w-6" />
                {stats.cashBalance.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-success to-success/80 text-white shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/80 text-sm">
                Today's Receipts
              </CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                {stats.todayReceipts.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-destructive to-destructive/80 text-white shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/80 text-sm">
                Today's Payments
              </CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 rotate-180" />
                {stats.todayPayments.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/80 text-sm">
                Active Members
              </CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                {stats.totalMembers}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-medium transition-all hover:scale-105"
            onClick={() => navigate("/day-book")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Day Book</CardTitle>
              <CardDescription>
                View and manage daily receipts and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                Open Day Book
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-medium transition-all hover:scale-105"
            onClick={() => navigate("/members")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-success rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage society members and their details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-secondary to-success">
                Manage Members
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-medium transition-all hover:scale-105"
            onClick={() => navigate("/vouchers")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary-light rounded-xl flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Vouchers</CardTitle>
              <CardDescription>
                Create and manage financial vouchers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-accent to-primary-light">
                View Vouchers
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
