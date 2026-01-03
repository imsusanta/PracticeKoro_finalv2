import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Eye, EyeOff, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.png";

// Password strength calculation
const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
  if (!password) return { level: 0, label: "", color: "bg-gray-200" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { level: 2, label: "Medium", color: "bg-amber-500" };
  return { level: 3, label: "Strong", color: "bg-emerald-500" };
};

// Email validation
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Get user-friendly error message
const getErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (message.includes("email not confirmed")) {
    return "Please verify your email address before logging in.";
  }
  if (message.includes("too many requests")) {
    return "Too many login attempts. Please wait a few minutes and try again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your internet connection.";
  }
  return error?.message || "An unexpected error occurred. Please try again.";
};

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "whatsapp">("email");
  const [touched, setTouched] = useState({ email: false, password: false, whatsappNumber: false });

  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: "",
  });

  const [whatsappFormData, setWhatsappFormData] = useState({
    whatsappNumber: "",
    password: "",
  });

  // Validation states
  const emailValidation = useMemo(() => {
    if (!touched.email || !emailFormData.email) return { valid: true, message: "" };
    if (!isValidEmail(emailFormData.email)) return { valid: false, message: "Please enter a valid email address" };
    return { valid: true, message: "" };
  }, [emailFormData.email, touched.email]);

  const passwordStrength = useMemo(() => getPasswordStrength(emailFormData.password), [emailFormData.password]);
  const whatsappPasswordStrength = useMemo(() => getPasswordStrength(whatsappFormData.password), [whatsappFormData.password]);

  const validateWhatsAppNumber = (number: string): boolean => {
    return /^\d{10}$/.test(number);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Pre-validation
    if (!isValidEmail(emailFormData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: emailFormData.email,
      password: emailFormData.password,
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Login Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }

    setLoading(false);
    toast({
      title: "Welcome Back!",
      description: "You've logged in successfully.",
    });
    navigate("/student/dashboard");
  };

  const handleWhatsAppLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWhatsAppNumber(whatsappFormData.whatsappNumber)) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid 10-digit WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const pseudoEmail = `${whatsappFormData.whatsappNumber}@whatsapp.practicekoro.local`;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: pseudoEmail,
      password: whatsappFormData.password,
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Login Failed",
        description: "Invalid WhatsApp number or password. Please check your credentials.",
        variant: "destructive",
      });
      return;
    }

    setLoading(false);
    toast({
      title: "Welcome Back!",
      description: "You've logged in successfully.",
    });
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Left Side - Illustration (Fixed position - doesn't scroll) */}
      <div
        className="hidden lg:flex items-center justify-center p-8 xl:p-12 overflow-hidden"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '50%',
          height: '100vh',
          backgroundColor: '#f1f8f5',
          zIndex: 10
        }}
      >
        <div className="relative w-full max-w-lg xl:max-w-xl">
          {/* Decorative elements */}
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-200/40 rounded-full blur-2xl" />

          {/* Main illustration container */}
          <div className="relative flex items-center justify-center w-full max-w-[480px]">
            <img
              src={loginIllustration}
              alt="Student studying illustration"
              className="w-full h-auto mix-blend-multiply transition-all duration-700 select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (offset from fixed left panel) */}
      <div className="min-h-screen flex flex-col lg:ml-[50%] xl:ml-[55%]">
        {/* Header with Sign Up button */}
        <div className="flex justify-end p-4 sm:p-6 lg:p-8">
          <Button
            variant="outline"
            onClick={() => navigate("/register")}
            className="rounded-full px-6 border-border/60 hover:bg-accent/50 transition-all"
          >
            Sign up
          </Button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8 lg:pb-0">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Illustration */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-[#f0fdf4] rounded-[2rem] p-4 border border-emerald-100/30 overflow-hidden">
                <img
                  src={loginIllustration}
                  alt="Student studying"
                  className="w-full h-full object-contain rounded-2xl mix-blend-multiply"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Welcome back!
              </h1>
              <p className="text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>

            {/* Login Method Tabs */}
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "whatsapp")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/60 rounded-xl p-1 mb-6">
                <TabsTrigger
                  value="email"
                  className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger
                  value="whatsapp"
                  className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>

              {/* Email Login Form */}
              <TabsContent value="email" className="mt-0">
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`h-14 pl-12 pr-10 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all text-base ${!emailValidation.valid ? 'border-red-500 focus:border-red-500' : ''}`}
                        value={emailFormData.email}
                        onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                        onBlur={() => setTouched({ ...touched, email: true })}
                      />
                      {touched.email && emailFormData.email && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {emailValidation.valid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {!emailValidation.valid && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {emailValidation.message}
                      </p>
                    )}
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
                        value={emailFormData.password}
                        onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {emailFormData.password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          <div className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-gray-200'}`} />
                          <div className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-gray-200'}`} />
                          <div className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-gray-200'}`} />
                        </div>
                        <p className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.label} password
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* WhatsApp Login Form */}
              <TabsContent value="whatsapp" className="mt-0">
                <form onSubmit={handleWhatsAppLogin} className="space-y-5">
                  {/* WhatsApp Number Field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber" className="text-sm font-medium text-muted-foreground">
                      WhatsApp Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Phone className="w-5 h-5" />
                      </div>
                      <Input
                        id="whatsappNumber"
                        type="tel"
                        required
                        placeholder="10-digit number"
                        maxLength={10}
                        className="h-14 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all text-base"
                        value={whatsappFormData.whatsappNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setWhatsappFormData({ ...whatsappFormData, whatsappNumber: value });
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter without country code</p>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsappPassword" className="text-sm font-medium text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        id="whatsappPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-14 pl-12 pr-12 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all text-base"
                        value={whatsappFormData.password}
                        onChange={(e) => setWhatsappFormData({ ...whatsappFormData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {whatsappFormData.password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          <div className={`h-1 flex-1 rounded-full transition-all ${whatsappPasswordStrength.level >= 1 ? whatsappPasswordStrength.color : 'bg-gray-200'}`} />
                          <div className={`h-1 flex-1 rounded-full transition-all ${whatsappPasswordStrength.level >= 2 ? whatsappPasswordStrength.color : 'bg-gray-200'}`} />
                          <div className={`h-1 flex-1 rounded-full transition-all ${whatsappPasswordStrength.level >= 3 ? whatsappPasswordStrength.color : 'bg-gray-200'}`} />
                        </div>
                        <p className={`text-xs font-medium ${whatsappPasswordStrength.color.replace('bg-', 'text-')}`}>
                          {whatsappPasswordStrength.label} password
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="remember-whatsapp"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <Label htmlFor="remember-whatsapp" className="text-sm text-muted-foreground cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Register Link (Mobile) */}
            <p className="text-center text-sm text-muted-foreground lg:hidden">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
