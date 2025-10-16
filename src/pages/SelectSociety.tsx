import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Plus, LogOut, Loader2 } from "lucide-react";

type Society = {
  id: string;
  name: string;
  registration_number: string | null;
};

export default function SelectSociety() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSociety, setNewSociety] = useState({
    name: "",
    registration_number: "",
    address: "",
    phone: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadSocieties();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadSocieties = async () => {
    try {
      const { data: societyUsers, error } = await supabase
        .from("society_users")
        .select("society_id, societies(id, name, registration_number)")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      const societiesData = societyUsers
        ?.map((su: any) => su.societies)
        .filter(Boolean) || [];
      setSocieties(societiesData);
    } catch (error: any) {
      toast.error("Failed to load societies");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: society, error: societyError } = await supabase
        .from("societies")
        .insert({
          name: newSociety.name,
          registration_number: newSociety.registration_number || null,
          address: newSociety.address || null,
          phone: newSociety.phone || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (societyError) throw societyError;

      // Create default account heads
      await supabase.rpc("create_default_account_heads", {
        p_society_id: society.id,
      });

      toast.success("Society created successfully!");
      setDialogOpen(false);
      setNewSociety({ name: "", registration_number: "", address: "", phone: "" });
      loadSocieties();
    } catch (error: any) {
      toast.error(error.message || "Failed to create society");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectSociety = (societyId: string) => {
    localStorage.setItem("selectedSocietyId", societyId);
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Select Society</h1>
            <p className="text-muted-foreground">Choose a society to manage or create a new one</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {societies.map((society) => (
            <Card
              key={society.id}
              className="cursor-pointer hover:shadow-medium transition-all hover:scale-105 bg-card"
              onClick={() => handleSelectSociety(society.id)}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{society.name}</CardTitle>
                <CardDescription>
                  {society.registration_number || "No registration number"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                  Open Society
                </Button>
              </CardContent>
            </Card>
          ))}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-medium transition-all hover:scale-105 border-2 border-dashed border-primary/30 bg-primary/5">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Create New Society</CardTitle>
                  <CardDescription>Add a new cooperative society</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Create Society
                  </Button>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Society</DialogTitle>
                <DialogDescription>
                  Enter the details for your new cooperative society
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSociety} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Society Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter society name"
                    value={newSociety.name}
                    onChange={(e) =>
                      setNewSociety({ ...newSociety, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    placeholder="Enter registration number"
                    value={newSociety.registration_number}
                    onChange={(e) =>
                      setNewSociety({
                        ...newSociety,
                        registration_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={newSociety.address}
                    onChange={(e) =>
                      setNewSociety({ ...newSociety, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newSociety.phone}
                    onChange={(e) =>
                      setNewSociety({ ...newSociety, phone: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Society"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
