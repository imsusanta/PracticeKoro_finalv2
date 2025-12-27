import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Mail, Phone } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<"email" | "whatsapp">("email");

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailFormData.password !== emailFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (emailFormData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: emailFormData.email,
      password: emailFormData.password,
      options: {
        data: {
          full_name: emailFormData.fullName,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created! You can now login and start using the platform.",
      });
      navigate("/login");
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWhatsAppNumber(whatsappFormData.whatsappNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    if (whatsappFormData.password !== whatsappFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (whatsappFormData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Check if WhatsApp number already exists in ACTIVE profiles
    // (only check profiles that have user_roles, ignoring orphaned/deleted profiles)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, user_roles!inner(role)")
      .eq("whatsapp_number", whatsappFormData.whatsappNumber)
      .maybeSingle();

    if (existingProfile) {
      setLoading(false);
      toast({
        title: "Error",
        description: "This WhatsApp number is already registered. Please login instead.",
        variant: "destructive",
      });
      return;
    }

    // Use WhatsApp number as pseudo-email for Supabase Auth
    const pseudoEmail = `${whatsappFormData.whatsappNumber}@whatsapp.practicekoro.local`;

    const { error } = await supabase.auth.signUp({
      email: pseudoEmail,
      password: whatsappFormData.password,
      options: {
        data: {
          full_name: whatsappFormData.fullName,
          whatsapp_number: whatsappFormData.whatsappNumber,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
        toast({
          title: "Error",
          description: "This WhatsApp number is already registered. Please login instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: "Account created! You can now login with your WhatsApp number.",
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 md:p-8">
      {/* Back button */}
      <Button
        variant="outline"
        className="absolute top-4 left-4 z-20 rounded-xl"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl shadow-xl border-gray-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-foreground">Create Account</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Register to access mock tests and study materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={registerMethod} onValueChange={(v) => setRegisterMethod(v as "email" | "whatsapp")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="John Doe"
                    value={emailFormData.fullName}
                    onChange={(e) => setEmailFormData({ ...emailFormData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="your.email@example.com"
                    value={emailFormData.email}
                    onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="At least 6 characters"
                    value={emailFormData.password}
                    onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="Re-enter your password"
                    value={emailFormData.confirmPassword}
                    onChange={(e) => setEmailFormData({ ...emailFormData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Register with Email"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="whatsapp">
              <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="whatsappFullName" className="text-foreground">Full Name</Label>
                  <Input
                    id="whatsappFullName"
                    type="text"
                    required
                    autoComplete="name"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="John Doe"
                    value={whatsappFormData.fullName}
                    onChange={(e) => setWhatsappFormData({ ...whatsappFormData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappNumber" className="text-foreground">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    required
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="10-digit number (e.g., 9876543210)"
                    maxLength={10}
                    value={whatsappFormData.whatsappNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setWhatsappFormData({ ...whatsappFormData, whatsappNumber: value });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter without country code</p>
                </div>
                <div>
                  <Label htmlFor="whatsappPassword" className="text-foreground">Password</Label>
                  <Input
                    id="whatsappPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="At least 6 characters"
                    value={whatsappFormData.password}
                    onChange={(e) => setWhatsappFormData({ ...whatsappFormData, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappConfirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="whatsappConfirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="bg-white border-gray-200 text-foreground placeholder:text-muted-foreground focus:bg-gray-50 transition-all"
                    placeholder="Re-enter your password"
                    value={whatsappFormData.confirmPassword}
                    onChange={(e) => setWhatsappFormData({ ...whatsappFormData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Register with WhatsApp"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <button
              type="button"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
              onClick={() => navigate("/login")}
            >
              Login here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
