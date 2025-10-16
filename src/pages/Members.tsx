import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Search, UserCheck, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Member = {
  id: string;
  member_number: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
};

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMember, setNewMember] = useState({
    member_number: "",
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, members]);

  const loadMembers = async () => {
    const societyId = localStorage.getItem("selectedSocietyId");
    if (!societyId) {
      navigate("/select-society");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("society_id", societyId)
        .order("member_number");

      if (error) throw error;
      setMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error: any) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchTerm) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.member_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const societyId = localStorage.getItem("selectedSocietyId");
    if (!societyId) return;

    try {
      const { error } = await supabase.from("members").insert({
        society_id: societyId,
        member_number: newMember.member_number,
        name: newMember.name,
        phone: newMember.phone || null,
        email: newMember.email || null,
        address: newMember.address || null,
        status: "active",
      });

      if (error) throw error;

      toast.success("Member added successfully!");
      setDialogOpen(false);
      setNewMember({
        member_number: "",
        name: "",
        phone: "",
        email: "",
        address: "",
      });
      loadMembers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Members</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Enter the details for the new member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member_number">Member Number *</Label>
                  <Input
                    id="member_number"
                    placeholder="e.g., M001"
                    value={newMember.member_number}
                    onChange={(e) =>
                      setNewMember({ ...newMember, member_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({ ...newMember, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={newMember.address}
                    onChange={(e) =>
                      setNewMember({ ...newMember, address: e.target.value })
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
                      Adding...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, member number, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchTerm ? "No members found matching your search" : "No members yet. Add your first member!"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        #{member.member_number}
                      </div>
                    </div>
                    <Badge
                      variant={member.status === "active" ? "default" : "secondary"}
                      className={
                        member.status === "active"
                          ? "bg-success text-white"
                          : "bg-muted"
                      }
                    >
                      {member.status === "active" ? (
                        <UserCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <UserX className="h-3 w-3 mr-1" />
                      )}
                      {member.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {member.phone && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {member.phone}
                    </div>
                  )}
                  {member.email && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {member.email}
                    </div>
                  )}
                  {member.address && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Address:</span>{" "}
                      {member.address}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
