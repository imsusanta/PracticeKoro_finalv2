import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, XCircle, Search, UserX, Key, UserCheck, Trash2, Clock, MoreVertical, Plus, Phone, Mail, User, Calendar, Shield, MessageSquare, Send, CreditCard, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  whatsapp_number: string | null;
  age: number | null;
  created_at: string;
  approval_status?: {
    status: string;
    reviewed_at: string | null;
    expires_at: string | null;
  };
}

const StudentManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [durationDialogOpen, setDurationDialogOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>("permanent");
  const [customDate, setCustomDate] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    whatsappNumber: "",
    password: "",
    fullName: ""
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [paymentReminderOpen, setPaymentReminderOpen] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [editActiveTimeDialogOpen, setEditActiveTimeDialogOpen] = useState(false);
  const [editDuration, setEditDuration] = useState<string>("permanent");
  const [editCustomDate, setEditCustomDate] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterStatus, students]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access Denied", description: "You do not have admin privileges", variant: "destructive" });
      navigate("/admin/login");
      return;
    }
    await loadStudents();
    setLoading(false);
  };

  const loadStudents = async () => {
    const { data: studentsData, error } = await supabase.from("profiles").select(`
      id, email, full_name, whatsapp_number, age, created_at,
      user_roles!inner(role),
      approval_status(status, reviewed_at, expires_at)
    `).eq("user_roles.role", "student").order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
      return;
    }

    const students = (studentsData || []).map((s: any) => ({
      id: s.id,
      email: s.email,
      full_name: s.full_name,
      whatsapp_number: s.whatsapp_number,
      age: s.age,
      created_at: s.created_at,
      approval_status: Array.isArray(s.approval_status) ? s.approval_status[0] : s.approval_status
    }));
    setStudents(students);
  };

  const applyFilters = () => {
    let filtered = [...students];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        // Extract WhatsApp number from pseudo-email if applicable
        const extractedWhatsApp = s.email?.includes("@whatsapp.practicekoro.local")
          ? s.email.split("@")[0]
          : null;

        return (
          (s.full_name?.toLowerCase() || "").includes(q) ||
          (s.whatsapp_number || "").includes(q) ||
          (extractedWhatsApp || "").includes(q) ||
          // Only search real emails, not pseudo-emails
          (!s.email?.includes("@whatsapp") && s.email?.toLowerCase().includes(q))
        );
      });
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(s => s.approval_status?.status === filterStatus);
    }
    setFilteredStudents(filtered);
  };

  const handleApprove = async (studentId: string, expiresAt?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("approval_status").update({
      status: "approved",
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
      expires_at: expiresAt || null
    }).eq("user_id", studentId);
    if (error) {
      toast({ title: "Error", description: "Failed to approve student", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Student approved" });
    await loadStudents();
  };

  const handleApproveWithDuration = async () => {
    if (!selectedStudent) return;
    let expiresAt: string | undefined;
    if (selectedDuration === "30days") {
      const date = new Date(); date.setDate(date.getDate() + 30);
      expiresAt = date.toISOString();
    } else if (selectedDuration === "60days") {
      const date = new Date(); date.setDate(date.getDate() + 60);
      expiresAt = date.toISOString();
    } else if (selectedDuration === "90days") {
      const date = new Date(); date.setDate(date.getDate() + 90);
      expiresAt = date.toISOString();
    } else if (selectedDuration === "custom" && customDate) {
      expiresAt = new Date(customDate).toISOString();
    }
    await handleApprove(selectedStudent.id, expiresAt);
    setDurationDialogOpen(false);
  };

  const handleReject = async (studentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("approval_status").update({
      status: "rejected",
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString()
    }).eq("user_id", studentId);
    if (error) {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Student rejected" });
    await loadStudents();
  };

  const handleDeactivate = async (studentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("approval_status").update({
      status: "deactivated",
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString()
    }).eq("user_id", studentId);
    if (error) {
      toast({ title: "Error", description: "Failed to deactivate", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Student deactivated" });
    await loadStudents();
  };

  const handlePaymentLock = async (studentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("approval_status").update({
      status: "payment_locked",
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString()
    }).eq("user_id", studentId);
    if (error) {
      console.error("Payment lock error:", error);
      toast({ title: "Error", description: error.message || "Failed to lock account", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Account locked for payment" });
    await loadStudents();
  };

  const handleActivate = async (studentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("approval_status").update({
      status: "approved",
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
      expires_at: null
    }).eq("user_id", studentId);
    if (error) {
      toast({ title: "Error", description: "Failed to activate", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Student activated" });
    await loadStudents();
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
        return;
      }

      // Call the edge function to properly delete the user (including auth)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-auth-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: selectedStudent.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast({ title: "Success", description: "Student deleted completely" });
      setDeleteDialogOpen(false);
      await loadStudents();
    } catch (error: any) {
      // Fallback: try manual deletion if edge function fails
      console.error("Edge function failed, trying manual deletion:", error);

      if (selectedStudent.whatsapp_number) {
        await supabase.from("profiles").update({ whatsapp_number: null }).eq("id", selectedStudent.id);
      }

      await supabase.from("approval_status").delete().eq("user_id", selectedStudent.id);
      await supabase.from("user_roles").delete().eq("user_id", selectedStudent.id);
      await supabase.from("profiles").delete().eq("id", selectedStudent.id);

      toast({
        title: "Partial Delete",
        description: "Profile deleted. Delete auth user from Supabase Dashboard to free WhatsApp number.",
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
      await loadStudents();
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentData.whatsappNumber || !newStudentData.password || !newStudentData.fullName) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(newStudentData.whatsappNumber)) {
      toast({ title: "Error", description: "Enter valid 10-digit number", variant: "destructive" });
      return;
    }
    if (newStudentData.password.length < 6) {
      toast({ title: "Error", description: "Password min 6 characters", variant: "destructive" });
      return;
    }
    setAddingStudent(true);
    try {
      // Check for active profiles with this WhatsApp number
      const { data: existingActive } = await supabase
        .from("profiles")
        .select("id, user_roles!inner(role)")
        .eq("whatsapp_number", newStudentData.whatsappNumber)
        .maybeSingle();

      if (existingActive) {
        toast({ title: "Error", description: "This WhatsApp number is already registered to an active account.", variant: "destructive" });
        setAddingStudent(false);
        return;
      }

      // Clear any orphaned profiles with this WhatsApp number (profiles without user_roles)
      const { data: orphanedProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("whatsapp_number", newStudentData.whatsappNumber);

      if (orphanedProfiles && orphanedProfiles.length > 0) {
        // These are orphaned records - clear their WhatsApp numbers
        for (const orphan of orphanedProfiles) {
          await supabase.from("profiles").update({ whatsapp_number: null }).eq("id", orphan.id);
        }
      }

      const pseudoEmail = `${newStudentData.whatsappNumber}@whatsapp.practicekoro.local`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pseudoEmail,
        password: newStudentData.password,
        options: { data: { full_name: newStudentData.fullName, whatsapp_number: newStudentData.whatsappNumber } }
      });
      if (authError) throw authError;
      toast({ title: "Success", description: "Student created successfully" });
      setAddStudentDialogOpen(false);
      setNewStudentData({ whatsappNumber: "", password: "", fullName: "" });
      setTimeout(() => loadStudents(), 1000);
    } catch (error: any) {
      // Handle duplicate key constraint error
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint") || error.message?.includes("already registered")) {
        toast({ title: "Error", description: "This WhatsApp number is already registered. The number may be linked to an existing auth account.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to create student", variant: "destructive" });
      }
    } finally {
      setAddingStudent(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedStudent) return;
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password min 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    setResettingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-student-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId: selectedStudent.id, newPassword })
      });
      if (!response.ok) throw new Error("Failed to reset password");
      toast({ title: "Success", description: "Password reset successfully" });
      setPasswordResetOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSendPaymentReminder = () => {
    if (!selectedStudent) return;

    const whatsappNumber = selectedStudent.whatsapp_number;
    if (!whatsappNumber) {
      toast({ title: "Error", description: "No WhatsApp number found for this student", variant: "destructive" });
      return;
    }

    const message = paymentMessage || `Hi ${selectedStudent.full_name || 'there'}, this is a reminder regarding your payment for Practice Koro. Please complete your payment to continue accessing all features. Thank you!`;

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({ title: "WhatsApp Opened", description: "Payment reminder message ready to send" });
    setPaymentReminderOpen(false);
    setPaymentMessage("");
  };

  const handleEditActiveTime = async () => {
    if (!selectedStudent) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let expiresAt: string | null = null;
    if (editDuration === "30days") {
      const date = new Date(); date.setDate(date.getDate() + 30);
      expiresAt = date.toISOString();
    } else if (editDuration === "60days") {
      const date = new Date(); date.setDate(date.getDate() + 60);
      expiresAt = date.toISOString();
    } else if (editDuration === "90days") {
      const date = new Date(); date.setDate(date.getDate() + 90);
      expiresAt = date.toISOString();
    } else if (editDuration === "custom" && editCustomDate) {
      expiresAt = new Date(editCustomDate).toISOString();
    }
    // permanent means null (no expiry)

    const { error } = await supabase.from("approval_status").update({
      expires_at: expiresAt,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString()
    }).eq("user_id", selectedStudent.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update active time", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Active time updated successfully" });
    setEditActiveTimeDialogOpen(false);
    setEditDuration("permanent");
    setEditCustomDate("");
    await loadStudents();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "deactivated": return "bg-gray-100 text-gray-600 border-gray-200";
      case "payment_locked": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const statusCounts = {
    all: students.length,
    pending: students.filter(s => s.approval_status?.status === "pending").length,
    approved: students.filter(s => s.approval_status?.status === "approved").length,
    rejected: students.filter(s => s.approval_status?.status === "rejected").length,
    deactivated: students.filter(s => s.approval_status?.status === "deactivated").length,
    payment_locked: students.filter(s => s.approval_status?.status === "payment_locked").length,
  };

  const AddButton = (
    <Button size="icon" onClick={() => setAddStudentDialogOpen(true)} className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 border border-white/20">
      <Plus className="w-5 h-5" />
    </Button>
  );

  if (loading) {
    return (
      <AdminLayout title="Student Management" subtitle="Manage student accounts">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-600 text-sm">Loading students...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Student Management" subtitle={`${students.length} students`} headerActions={AddButton}>
      <div className="space-y-6">
        {/* Filter Tabs - Colored Card Style */}
        <div className="flex overflow-x-auto gap-3 pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-5 md:gap-4 no-scrollbar">
          {[
            { key: "all", label: "All", count: statusCounts.all, bgColor: "bg-emerald-50", textColor: "text-emerald-600", borderColor: "border-emerald-400", ringColor: "ring-emerald-400" },
            { key: "pending", label: "Pending", count: statusCounts.pending, bgColor: "bg-amber-50", textColor: "text-amber-600", borderColor: "border-amber-300", ringColor: "ring-amber-300" },
            { key: "approved", label: "Approved", count: statusCounts.approved, bgColor: "bg-green-50", textColor: "text-green-600", borderColor: "border-green-300", ringColor: "ring-green-300" },
            { key: "rejected", label: "Rejected", count: statusCounts.rejected, bgColor: "bg-red-50", textColor: "text-red-500", borderColor: "border-red-300", ringColor: "ring-red-300" },
            { key: "deactivated", label: "Inactive", count: statusCounts.deactivated, bgColor: "bg-gray-50", textColor: "text-gray-500", borderColor: "border-gray-300", ringColor: "ring-gray-300" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`flex flex-col items-center justify-center min-w-[100px] md:min-w-0 py-4 px-5 rounded-2xl transition-all duration-200 shrink-0 ${item.bgColor} border-2 ${filterStatus === item.key
                ? `${item.borderColor}`
                : "border-transparent hover:border-gray-200"
                }`}
            >
              <span className={`text-2xl md:text-3xl font-bold ${item.textColor}`}>{item.count}</span>
              <span className={`text-xs font-medium ${item.textColor} mt-1`}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Students List - Row Based */}
        {filteredStudents.length === 0 ? (
          <Card className="border-0 bg-white rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-gray-500 text-sm">{searchQuery || filterStatus !== "all" ? "Try different filters" : "No students registered yet"}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-white rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Student</span>
              <span>Contact</span>
              <span>Status</span>
              <span>Joined</span>
              <span className="text-center">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => {
                const status = student.approval_status?.status || "pending";

                return (
                  <div key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Desktop Row */}
                    <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 items-center">
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-sm ${status === "approved" ? "bg-gradient-to-br from-emerald-500 to-teal-600" :
                          status === "pending" ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                            "bg-gradient-to-br from-gray-400 to-gray-500"
                          }`}>
                          {student.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{student.full_name || "No Name"}</p>
                          {student.age && <p className="text-xs text-gray-500">{student.age} years old</p>}
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="min-w-0">
                        {(() => {
                          // Get WhatsApp number - from field or extract from pseudo-email
                          const displayWhatsApp = student.whatsapp_number ||
                            (student.email?.includes("@whatsapp.practicekoro.local")
                              ? student.email.split("@")[0]
                              : null);

                          return displayWhatsApp ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span>{displayWhatsApp}</span>
                            </div>
                          ) : null;
                        })()}
                        {!student.email?.includes("@whatsapp") && student.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 truncate">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 w-fit ${getStatusColor(status)}`}>
                          {status.toUpperCase()}
                        </Badge>
                        {status === "approved" && student.approval_status?.expires_at && (
                          <span className="text-[10px] text-amber-600 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(student.approval_status.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Joined Date */}
                      <div className="text-sm text-gray-600">
                        {new Date(student.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl min-w-[180px]">
                            <DropdownMenuItem onClick={() => { setSelectedStudent(student); setDetailsOpen(true); }} className="gap-2">
                              <User className="w-4 h-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setDurationDialogOpen(true); }} className="gap-2 text-emerald-600">
                                  <CheckCircle className="w-4 h-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(student.id)} className="gap-2 text-red-600">
                                  <XCircle className="w-4 h-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {status === "approved" && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedStudent(student);
                                  // Pre-fill with current expiry if exists
                                  if (student.approval_status?.expires_at) {
                                    setEditDuration("custom");
                                    setEditCustomDate(student.approval_status.expires_at.split("T")[0]);
                                  } else {
                                    setEditDuration("permanent");
                                    setEditCustomDate("");
                                  }
                                  setEditActiveTimeDialogOpen(true);
                                }} className="gap-2 text-indigo-600">
                                  <Edit className="w-4 h-4" /> Edit Active Time
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPasswordResetOpen(true); }} className="gap-2">
                                  <Key className="w-4 h-4" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPaymentMessage(""); setPaymentReminderOpen(true); }} className="gap-2 text-blue-600">
                                  <MessageSquare className="w-4 h-4" /> Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePaymentLock(student.id)} className="gap-2 text-rose-600">
                                  <CreditCard className="w-4 h-4" /> Lock for Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeactivate(student.id)} className="gap-2 text-orange-600">
                                  <UserX className="w-4 h-4" /> Deactivate
                                </DropdownMenuItem>
                              </>
                            )}
                            {(status === "rejected" || status === "deactivated" || status === "payment_locked") && (
                              <>
                                <DropdownMenuItem onClick={() => handleActivate(student.id)} className="gap-2 text-emerald-600">
                                  <UserCheck className="w-4 h-4" /> Activate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPaymentMessage(""); setPaymentReminderOpen(true); }} className="gap-2 text-blue-600">
                                  <MessageSquare className="w-4 h-4" /> Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setDeleteDialogOpen(true); }} className="gap-2 text-red-600">
                                  <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                            {status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPaymentMessage(""); setPaymentReminderOpen(true); }} className="gap-2 text-blue-600">
                                  <MessageSquare className="w-4 h-4" /> Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePaymentLock(student.id)} className="gap-2 text-rose-600">
                                  <CreditCard className="w-4 h-4" /> Lock for Payment
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mobile Row */}
                    <div className="md:hidden p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-sm ${status === "approved" ? "bg-gradient-to-br from-emerald-500 to-teal-600" :
                          status === "pending" ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                            "bg-gradient-to-br from-gray-400 to-gray-500"
                          }`}>
                          {student.full_name?.[0]?.toUpperCase() || "?"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate text-sm">{student.full_name || "No Name"}</p>
                            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 shrink-0 ${getStatusColor(status)}`}>
                              {status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            {(() => {
                              const displayWhatsApp = student.whatsapp_number ||
                                (student.email?.includes("@whatsapp.practicekoro.local")
                                  ? student.email.split("@")[0]
                                  : null);
                              return displayWhatsApp ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {displayWhatsApp}
                                </span>
                              ) : null;
                            })()}
                            {student.age && <span>• {student.age}y</span>}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-emerald-50 shrink-0">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl min-w-[180px]">
                            <DropdownMenuItem onClick={() => { setSelectedStudent(student); setDetailsOpen(true); }} className="gap-2">
                              <User className="w-4 h-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setDurationDialogOpen(true); }} className="gap-2 text-emerald-600">
                                  <CheckCircle className="w-4 h-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(student.id)} className="gap-2 text-red-600">
                                  <XCircle className="w-4 h-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {status === "approved" && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedStudent(student);
                                  // Pre-fill with current expiry if exists
                                  if (student.approval_status?.expires_at) {
                                    setEditDuration("custom");
                                    setEditCustomDate(student.approval_status.expires_at.split("T")[0]);
                                  } else {
                                    setEditDuration("permanent");
                                    setEditCustomDate("");
                                  }
                                  setEditActiveTimeDialogOpen(true);
                                }} className="gap-2 text-indigo-600">
                                  <Edit className="w-4 h-4" /> Edit Active Time
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPasswordResetOpen(true); }} className="gap-2">
                                  <Key className="w-4 h-4" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPaymentMessage(""); setPaymentReminderOpen(true); }} className="gap-2 text-blue-600">
                                  <MessageSquare className="w-4 h-4" /> Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePaymentLock(student.id)} className="gap-2 text-rose-600">
                                  <CreditCard className="w-4 h-4" /> Lock for Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeactivate(student.id)} className="gap-2 text-orange-600">
                                  <UserX className="w-4 h-4" /> Deactivate
                                </DropdownMenuItem>
                              </>
                            )}
                            {(status === "rejected" || status === "deactivated" || status === "payment_locked") && (
                              <>
                                <DropdownMenuItem onClick={() => handleActivate(student.id)} className="gap-2 text-emerald-600">
                                  <UserCheck className="w-4 h-4" /> Activate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPaymentMessage(""); setPaymentReminderOpen(true); }} className="gap-2 text-blue-600">
                                  <MessageSquare className="w-4 h-4" /> Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setDeleteDialogOpen(true); }} className="gap-2 text-red-600">
                                  <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                            {status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => { setSelectedStudent(student); setPaymentMessage(""); setPaymentReminderOpen(true); }} className="gap-2 text-blue-600">
                                  <MessageSquare className="w-4 h-4" /> Payment Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePaymentLock(student.id)} className="gap-2 text-rose-600">
                                  <CreditCard className="w-4 h-4" /> Lock for Payment
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Expiry Warning for Mobile */}
                      {status === "approved" && student.approval_status?.expires_at && (
                        <div className="mt-2 ml-13">
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            <Clock className="w-2.5 h-2.5" />
                            Expires: {new Date(student.approval_status.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedStudent.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedStudent.full_name || "No Name"}</h3>
                  <Badge className={getStatusColor(selectedStudent.approval_status?.status)}>
                    {selectedStudent.approval_status?.status || "pending"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                {(() => {
                  const displayWhatsApp = selectedStudent.whatsapp_number ||
                    (selectedStudent.email?.includes("@whatsapp.practicekoro.local")
                      ? selectedStudent.email.split("@")[0]
                      : null);
                  return displayWhatsApp ? (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{displayWhatsApp}</span>
                    </div>
                  ) : null;
                })()}
                {!selectedStudent.email?.includes("@whatsapp") && selectedStudent.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{selectedStudent.email}</span>
                  </div>
                )}
                {selectedStudent.age && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedStudent.age} years old</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined {new Date(selectedStudent.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Duration Dialog */}
      <Dialog open={durationDialogOpen} onOpenChange={setDurationDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Approve Student</DialogTitle>
            <DialogDescription>Set access duration for {selectedStudent?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {[
              { value: "permanent", label: "Permanent (No expiry)" },
              { value: "30days", label: "30 Days" },
              { value: "60days", label: "60 Days" },
              { value: "90days", label: "90 Days" },
              { value: "custom", label: "Custom Date" },
            ].map((opt) => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedDuration === opt.value ? "bg-emerald-100 ring-2 ring-emerald-500" : "bg-gray-50 hover:bg-gray-100"
                }`}>
                <input type="radio" name="duration" value={opt.value} checked={selectedDuration === opt.value} onChange={(e) => setSelectedDuration(e.target.value)} className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">{opt.label}</span>
              </label>
            ))}
            {selectedDuration === "custom" && (
              <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="ml-7 rounded-xl" />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDurationDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleApproveWithDuration} disabled={selectedDuration === "custom" && !customDate} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
              <CheckCircle className="w-4 h-4 mr-2" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Student</DialogTitle>
            <DialogDescription>This will permanently delete {selectedStudent?.full_name}. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set new password for {selectedStudent?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="h-12 rounded-xl mt-1" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="h-12 rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordResetOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handlePasswordReset} disabled={resettingPassword || !newPassword || !confirmPassword} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
              <Key className="w-4 h-4 mr-2" /> {resettingPassword ? "Resetting..." : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>Create a new student account manually</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Student's name"
                className="h-12 rounded-xl"
                value={newStudentData.fullName}
                onChange={(e) => setNewStudentData({ ...newStudentData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input
                placeholder="10-digit number"
                className="h-12 rounded-xl"
                maxLength={10}
                value={newStudentData.whatsappNumber}
                onChange={(e) => setNewStudentData({ ...newStudentData, whatsappNumber: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                className="h-12 rounded-xl"
                value={newStudentData.password}
                onChange={(e) => setNewStudentData({ ...newStudentData, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddStudentDialogOpen(false)} className="rounded-xl h-12 flex-1 sm:flex-none">Cancel</Button>
            <Button
              onClick={handleAddStudent}
              disabled={addingStudent}
              className="rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex-1 sm:flex-none"
            >
              {addingStudent ? "Creating..." : "Create Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Reminder Dialog */}
      <Dialog open={paymentReminderOpen} onOpenChange={setPaymentReminderOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Send Payment Reminder
            </DialogTitle>
            <DialogDescription>
              Send a WhatsApp payment reminder to <strong>{selectedStudent?.full_name || "this student"}</strong>
              {selectedStudent?.whatsapp_number && (
                <span className="block text-sm mt-1">
                  WhatsApp: <strong>+91 {selectedStudent.whatsapp_number}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message (Optional - leave empty for default)</Label>
              <Textarea
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                placeholder={`Hi ${selectedStudent?.full_name || 'there'}, this is a reminder regarding your payment for Practice Koro. Please complete your payment to continue accessing all features. Thank you!`}
                className="rounded-xl mt-2 min-h-[120px]"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-2">
                Customize the message or leave empty to use the default reminder text
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentReminderOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSendPaymentReminder}
              disabled={!selectedStudent?.whatsapp_number}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Active Time Dialog */}
      <Dialog open={editActiveTimeDialogOpen} onOpenChange={setEditActiveTimeDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-500" />
              Edit Active Time
            </DialogTitle>
            <DialogDescription>Change access duration for {selectedStudent?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedStudent?.approval_status?.expires_at && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Current expiry: <strong>{new Date(selectedStudent.approval_status.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </p>
              </div>
            )}
            {!selectedStudent?.approval_status?.expires_at && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-emerald-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Current: <strong>Permanent (No expiry)</strong>
                </p>
              </div>
            )}
            {[
              { value: "permanent", label: "Permanent (No expiry)" },
              { value: "30days", label: "30 Days from today" },
              { value: "60days", label: "60 Days from today" },
              { value: "90days", label: "90 Days from today" },
              { value: "custom", label: "Custom Date" },
            ].map((opt) => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${editDuration === opt.value ? "bg-indigo-100 ring-2 ring-indigo-500" : "bg-gray-50 hover:bg-gray-100"
                }`}>
                <input type="radio" name="editDuration" value={opt.value} checked={editDuration === opt.value} onChange={(e) => setEditDuration(e.target.value)} className="w-4 h-4 text-indigo-600" />
                <span className="font-medium">{opt.label}</span>
              </label>
            ))}
            {editDuration === "custom" && (
              <Input type="date" value={editCustomDate} onChange={(e) => setEditCustomDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="ml-7 rounded-xl" />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditActiveTimeDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleEditActiveTime} disabled={editDuration === "custom" && !editCustomDate} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
              <Edit className="w-4 h-4 mr-2" /> Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default StudentManagement;