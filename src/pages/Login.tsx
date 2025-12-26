import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, Eye, EyeOff, Zap } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "whatsapp">("email");

  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: "",
  });

  const [whatsappFormData, setWhatsappFormData] = useState({
    whatsappNumber: "",
    password: "",
  });

  const validateWhatsAppNumber = (number: string): boolean => {
    return /^\d{10}$/.test(number);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: emailFormData.email,
      password: emailFormData.password,
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(false);
    toast({
      title: "Success",
      description: "Logged in successfully!",
    });
    navigate("/student/dashboard");
  };

  const handleWhatsAppLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWhatsAppNumber(whatsappFormData.whatsappNumber)) {
      toast({
        title: "Error",
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
        title: "Error",
        description: "Invalid WhatsApp number or password",
        variant: "destructive",
      });
      return;
    }

    setLoading(false);
    toast({
      title: "Success",
      description: "Logged in successfully!",
    });
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Mobile Header - Just Back Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <main className="flex-1 flex flex-col px-5 pb-8">
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-4 py-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to continue learning</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 p-5">
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "whatsapp")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 h-12 bg-gray-100/80 rounded-xl p-1">
                <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:shadow-sm h-10 rounded-lg data-[state=active]:bg-white">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2 data-[state=active]:shadow-sm h-10 rounded-lg data-[state=active]:bg-white">
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-0">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      value={emailFormData.email}
                      onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline font-medium"
                        onClick={() => navigate("/forgot-password")}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10"
                        value={emailFormData.password}
                        onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-0">
                <form onSubmit={handleWhatsAppLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      required
                      placeholder="10-digit number"
                      maxLength={10}
                      className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      value={whatsappFormData.whatsappNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setWhatsappFormData({ ...whatsappFormData, whatsappNumber: value });
                      }}
                    />
                    <p className="text-xs text-gray-500">Enter without country code</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappPassword" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="whatsappPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10"
                        value={whatsappFormData.password}
                        onChange={(e) => setWhatsappFormData({ ...whatsappFormData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary font-semibold hover:underline"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
