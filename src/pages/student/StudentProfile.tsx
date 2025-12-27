import { useEffect, useState } from "react";
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
  Clock
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("pending");
  const [statistics, setStatistics] = useState<ProfileStatistics>({ totalTests: 0, passRate: 0 });
  const [formData, setFormData] = useState({ full_name: "", whatsapp_number: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [accountDays, setAccountDays] = useState(0);

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
    // Always clear storage and navigate, even if signOut fails
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

  // Loading State - Inside Layout for smooth transitions
  if (loading) {
    return (
      <StudentLayout title="Profile" subtitle="Your account">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  // Payment Locked State - Inside Layout for smooth transitions
  if (approvalStatus === "payment_locked") {
    return (
      <StudentLayout title="Profile" subtitle="Your account">
        <div className="w-full md:max-w-4xl md:mx-auto flex items-center justify-center min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm w-full"
          >
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Locked</h2>
            <p className="text-slate-500 mb-8">Complete payment to continue</p>
            <button
              onClick={() => window.open("https://wa.me/919547771118", "_blank")}
              className="w-full bg-emerald-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </button>
          </motion.div>
        </div>
      </StudentLayout>
    );
  }

  // Get initials for avatar
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  return (
    <StudentLayout title="Profile" subtitle="Your account">
      <div className="max-w-2xl mx-auto space-y-4 pb-24">

        {/* ═══════════════════════════════════════════════════════════════
            PREMIUM PROFILE HEADER
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5 md:p-6"
        >
          <div className="flex items-center gap-4">
            {/* Avatar with Initials */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)' }}
            >
              <span className="text-xl md:text-2xl font-bold text-white">{initials}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-base md:text-xl truncate font-display">{profile?.full_name || "Student"}</h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                {approvalStatus === "approved" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Pending
                  </span>
                )}
                <span className="text-[10px] sm:text-xs text-slate-400">{accountDays === 0 ? 'Joined today' : `${accountDays}d member`}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            STATS CARDS
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="card-premium p-4 text-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-3"
              style={{ boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 font-mono">{statistics.totalTests}</p>
            <p className="text-xs text-slate-500 font-medium">Tests Taken</p>
          </div>
          <div className="card-premium p-4 text-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3"
              style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-blue-600 font-mono">{statistics.passRate}%</p>
            <p className="text-xs text-slate-500 font-medium">Pass Rate</p>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            ACCOUNT DETAILS FORM
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium overflow-hidden"
        >
          <div className="p-4 bg-slate-50/80 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Details</p>
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Full Name</p>
                {isEditing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-native h-11"
                    placeholder="Your name"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900 truncate">{formData.full_name || "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">WhatsApp Number</p>
                {isEditing ? (
                  <Input
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value.replace(/\D/g, '') })}
                    className="input-native h-11"
                    placeholder="10 digit number"
                    maxLength={10}
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-900">{formData.whatsapp_number || "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="w-full btn-native bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            QUICK LINKS - Native iOS/Android Style
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium overflow-hidden"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/results")}
            className="flex items-center gap-4 p-4 w-full text-left border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Results</p>
              <p className="text-xs text-slate-400">View your performance</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student/exams")}
            className="flex items-center gap-4 p-4 w-full text-left border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Mock Tests</p>
              <p className="text-xs text-slate-400">Browse all tests</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 w-full text-left hover:bg-red-50/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-600 text-sm">Logout</p>
              <p className="text-xs text-slate-400">Sign out of account</p>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
