import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Loader2, Shield, Zap, LayoutDashboard, Users, FileEdit, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        navigate("/admin/dashboard");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        toast({
          title: "Login Failed",
          description: authError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError || !roleData) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You do not have administrative privileges.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Login Successful",
          description: "Welcome back, Admin.",
        });
        navigate("/admin/dashboard");
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "An unexpected error occurred",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Left Side - Premium Admin Branding (Fixed position - doesn't scroll) */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-8 xl:p-12 overflow-hidden"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '50%',
          height: '100vh',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          zIndex: 10
        }}
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-400/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-20 w-full max-w-lg flex flex-col items-center text-center">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6 justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
                <Zap className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="text-left">
                <h2 className="text-4xl font-extrabold text-white tracking-tight">Practice Koro</h2>
                <div className="flex items-center gap-1.5 text-indigo-100/80 text-sm font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Control Center</span>
                </div>
              </div>
            </div>
            <p className="text-indigo-50 text-lg font-medium opacity-90 max-w-sm mx-auto">
              Secure administrative access. Manage content, monitor students, and analyze performance.
            </p>
          </motion.div>

          {/* Branding Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center gap-2 text-indigo-100/40 text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            <span>Secure Admin Control v2.0</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form (offset from fixed left panel) */}
      <div className="min-h-screen flex flex-col lg:ml-[50%]">
        {/* Header with Back button and Student Login */}
        <div className="flex justify-between items-center p-4 sm:p-6 lg:p-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="rounded-full px-4 border-border/60 hover:bg-accent/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
            className="rounded-full px-6 border-border/60 hover:bg-accent/50 transition-all"
          >
            Student Login
          </Button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8 lg:pb-0">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Branding */}
            <div className="lg:hidden flex flex-col items-center mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg mb-2"
              >
                <Zap className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Admin Portal</h1>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Practice Koro Management</p>
            </div>

            {/* Welcome Text */}
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Secure Access
              </h1>
              <p className="text-sm text-muted-foreground">
                Administrative authentication required
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-medium text-muted-foreground">
                  Admin Email
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className="h-14 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all text-base"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-14 pl-12 pr-12 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all text-base"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="data-[state=checked]:bg-orange-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg shadow-orange-500/25 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In as Admin"
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="p-4 bg-muted/50 rounded-xl border border-border/40">
              <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Protected admin-only access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
