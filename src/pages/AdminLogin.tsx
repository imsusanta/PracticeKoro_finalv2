import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setLoading(false);
      toast({ title: "Error", description: authError.message, variant: "destructive" });
      return;
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    setLoading(false);

    if (roleError || !roleData) {
      await supabase.auth.signOut();
      toast({ title: "Access Denied", description: "You do not have admin privileges", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Admin login successful!" });
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-muted/30">
      {/* Left Side - Illustration (Hidden on mobile, Fixed position) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] fixed left-0 top-0 h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 items-center justify-center p-8 xl:p-12">
        <div className="relative w-full max-w-lg xl:max-w-xl">
          {/* Decorative elements */}
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-rose-200/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-orange-200/40 rounded-full blur-2xl" />

          {/* Main illustration container */}
          <div className="relative bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-6 xl:p-8 shadow-xl shadow-rose-100/50 border border-white/80">
            <img
              src={loginIllustration}
              alt="Admin portal illustration"
              className="w-full h-auto rounded-2xl"
            />
            {/* Admin Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-orange-500 px-6 py-2 rounded-full shadow-lg shadow-red-500/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">Admin Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:ml-[50%] xl:ml-[55%]">
        {/* Header with Back button */}
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
            {/* Mobile Illustration */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-3xl p-4 shadow-lg shadow-rose-100/30 relative">
                <img
                  src={loginIllustration}
                  alt="Admin portal"
                  className="w-full h-full object-cover rounded-2xl"
                />
                {/* Admin Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 rounded-full shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-semibold text-xs">Admin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Admin Portal
              </h1>
              <p className="text-muted-foreground">
                Secure access for administrators
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
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
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
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
                <Lock className="w-4 h-4" />
                Protected admin-only access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
