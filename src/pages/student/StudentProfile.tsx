import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  TrendingUp,
  Phone,
  ChevronRight,
  BookOpen,
  LogOut,
  Lock,
  MessageSquare,
  Pencil,
  CheckCircle,
  Shield,
  Clock,
  Camera
} from "lucide-react";
import StudentLayout from "@/components/student/StudentLayout";
import { differenceInDays } from "date-fns";
import { motion } from "framer-motion";

interface ProfileStatistics {
  totalTests: number;
  passRate: number;
}

const StudentProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("pending");
  const [statistics, setStatistics] = useState<ProfileStatistics>({ totalTests: 0, passRate: 0 });
  const [formData, setFormData] = useState({ full_name: "", whatsapp_number: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [accountDays, setAccountDays] = useState(0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast({ title: "Success", description: "Profile photo updated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload", variant: "destructive" });
    }
    setUploadingImage(false);
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const [profileResult, approvalResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).single(),
      supabase.from("approval_status").select("status").eq("user_id", session.user.id).single()
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data);
      setFormData({
        full_name: profileResult.data.full_name || "",
        whatsapp_number: profileResult.data.whatsapp_number || "",
      });
      if (profileResult.data.created_at) {
        setAccountDays(differenceInDays(new Date(), new Date(profileResult.data.created_at)));
      }
    }

    setApprovalStatus(approvalResult.data?.status || "pending");
    await loadStatistics(session.user.id);
    setLoading(false);
  };

  const loadStatistics = async (userId: string) => {
    const { data: attempts } = await supabase
      .from("test_attempts")
      .select("passed")
      .eq("user_id", userId);

    if (attempts && attempts.length > 0) {
      const passed = attempts.filter(a => a.passed).length;
      setStatistics({
        totalTests: attempts.length,
        passRate: Math.round((passed / attempts.length) * 100),
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
    navigate("/");
  };

  const handleSubmit = async () => {
    if (formData.whatsapp_number && !/^\d{10}$/.test(formData.whatsapp_number)) {
      toast({ title: "Error", description: "Enter valid 10-digit number", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: formData.full_name,
      whatsapp_number: formData.whatsapp_number,
    }).eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!" });
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <StudentLayout title="Profile" subtitle="Your account">
        <div className="w-full flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (approvalStatus === "payment_locked") {
    return (
      <StudentLayout title="Profile" subtitle="Your account">
        <div className="w-full flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-full px-4"
          >
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Account Locked</h2>
            <p className="text-sm text-slate-500 mb-6">Complete payment to continue</p>
            <button
              onClick={() => window.open("https://wa.me/919547771118", "_blank")}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </button>
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  return (
    <StudentLayout title="Profile" subtitle="Your account">
      <div className="w-full space-y-3 pb-24">

        {/* Premium Profile Header - Matches Dashboard Height */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Header - Matches Dashboard style */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar with Upload */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg shrink-0 overflow-hidden group"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-xs sm:text-sm font-medium mb-1">👤 Profile</p>
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{profile?.full_name || "Student"}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  {approvalStatus === "approved" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-100 bg-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-100 bg-amber-500/30 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row - 3 columns like Dashboard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">{statistics.totalTests}</p>
                <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">Tests</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-300">{statistics.passRate}%</p>
                <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">Pass Rate</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">{accountDays === 0 ? '0' : accountDays}</p>
                <p className="text-white/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">Days</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-100 overflow-hidden"
        >
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Account Details</p>
          </div>

          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-400 font-medium uppercase mb-0.5">Full Name</p>
                {isEditing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-9 text-sm"
                    placeholder="Your name"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 truncate">{formData.full_name || "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-slate-400 font-medium uppercase mb-0.5">WhatsApp</p>
                {isEditing ? (
                  <Input
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value.replace(/\D/g, '') })}
                    className="h-9 text-sm"
                    placeholder="10 digit number"
                    maxLength={10}
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900">{formData.whatsapp_number || "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-100">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-10 rounded-xl text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full h-10 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-100 overflow-hidden"
        >
          <button
            onClick={() => navigate("/student/results")}
            className="flex items-center gap-3 p-3 w-full text-left border-b border-slate-100 active:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Results</p>
              <p className="text-[10px] text-slate-400">View performance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => navigate("/student/exams")}
            className="flex items-center gap-3 p-3 w-full text-left border-b border-slate-100 active:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Mock Tests</p>
              <p className="text-[10px] text-slate-400">Browse tests</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full text-left active:bg-red-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-600 text-sm">Logout</p>
              <p className="text-[10px] text-slate-400">Sign out</p>
            </div>
          </button>
        </motion.div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;