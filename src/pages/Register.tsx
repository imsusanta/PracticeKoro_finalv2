import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Lock, User, Loader2 } from "lucide-react";
import loginIllustration from "@/assets/login-illustration.png";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<"email" | "whatsapp">("whatsapp");

  const [emailFormData, setEmailFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [whatsappFormData, setWhatsappFormData] = useState({
    fullName: "",
    whatsappNumber: "",
    password: "",
    confirmPassword: "",
  });

  const validateWhatsAppNumber = (number: string): boolean => {
    return /^\d{10}$/.test(number);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailFormData.password !== emailFormData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (emailFormData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: emailFormData.email,
      password: emailFormData.password,
      options: {
        data: { full_name: emailFormData.fullName },
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Account created successfully!" });
    navigate("/login");
  };

  const handleWhatsAppRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWhatsAppNumber(whatsappFormData.whatsappNumber)) {
      toast({ title: "Error", description: "Please enter a valid 10-digit WhatsApp number", variant: "destructive" });
      return;
    }

    if (whatsappFormData.password !== whatsappFormData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (whatsappFormData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Check if WhatsApp number already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", whatsappFormData.whatsappNumber)
      .maybeSingle();

    if (existing) {
      setLoading(false);
      toast({ title: "Error", description: "This WhatsApp number is already registered", variant: "destructive" });
      return;
    }

    const pseudoEmail = `${whatsappFormData.whatsappNumber}@whatsapp.practicekoro.local`;

    const { error } = await supabase.auth.signUp({
      email: pseudoEmail,
      password: whatsappFormData.password,
      options: {
        data: {
          full_name: whatsappFormData.fullName,
          whatsapp_number: whatsappFormData.whatsappNumber,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Account created successfully!" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-muted/30">
      {/* Left Side - Illustration (Hidden on mobile, Fixed position) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] fixed left-0 top-0 h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 items-center justify-center p-8 xl:p-12">
        <div className="relative w-full max-w-lg xl:max-w-xl">
          {/* Decorative elements */}
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-violet-200/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl" />

          {/* Main illustration container */}
          <div className="relative bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-6 xl:p-8 shadow-xl shadow-violet-100/50 border border-white/80">
            <img
              src={loginIllustration}
              alt="Student studying illustration"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:ml-[50%] xl:ml-[55%]">
        {/* Header with Login button */}
        <div className="flex justify-end p-4 sm:p-6 lg:p-8">
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
            className="rounded-full px-6 border-border/60 hover:bg-accent/50 transition-all"
          >
            Login
          </Button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8 lg:pb-0">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Illustration */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-3xl p-4 shadow-lg shadow-violet-100/30">
                <img
                  src={loginIllustration}
                  alt="Student studying"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Register to access mock tests and study materials
              </p>
            </div>

            {/* Register Method Tabs */}
            <Tabs value={registerMethod} onValueChange={(v) => setRegisterMethod(v as "email" | "whatsapp")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/60 rounded-xl p-1 mb-6">
                <TabsTrigger
                  value="whatsapp"
                  className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
              </TabsList>

              {/* Email Register Form */}
              <TabsContent value="email" className="mt-0">
                <form onSubmit={handleEmailRegister} className="space-y-4">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <Input
                        id="fullName"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={emailFormData.fullName}
                        onChange={(e) => setEmailFormData({ ...emailFormData, fullName: e.target.value })}
                      />
                    </div>
                  </div>

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
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={emailFormData.email}
                        onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
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
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={emailFormData.password}
                        onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        placeholder="Re-enter password"
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={emailFormData.confirmPassword}
                        onChange={(e) => setEmailFormData({ ...emailFormData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Register Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* WhatsApp Register Form */}
              <TabsContent value="whatsapp" className="mt-0">
                <form onSubmit={handleWhatsAppRegister} className="space-y-4">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsappFullName" className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <Input
                        id="whatsappFullName"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={whatsappFormData.fullName}
                        onChange={(e) => setWhatsappFormData({ ...whatsappFormData, fullName: e.target.value })}
                      />
                    </div>
                  </div>

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
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
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
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={whatsappFormData.password}
                        onChange={(e) => setWhatsappFormData({ ...whatsappFormData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsappConfirmPassword" className="text-sm font-medium text-muted-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        id="whatsappConfirmPassword"
                        type="password"
                        required
                        placeholder="Re-enter password"
                        className="h-12 pl-12 pr-4 bg-muted/40 border-border/40 rounded-xl focus:bg-background transition-all"
                        value={whatsappFormData.confirmPassword}
                        onChange={(e) => setWhatsappFormData({ ...whatsappFormData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Register Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Login Link (Mobile) */}
            <p className="text-center text-sm text-muted-foreground lg:hidden">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
