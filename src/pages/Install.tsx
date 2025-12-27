import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Download, 
  Smartphone, 
  Zap, 
  CheckCircle, 
  Share, 
  Plus, 
  Wifi, 
  Bell, 
  Shield,
  ArrowLeft,
  Chrome,
  Apple
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setInstalling(false);
  };

  const features = [
    { icon: Wifi, title: "Works Offline", description: "Access your tests even without internet", color: "from-blue-500 to-cyan-500" },
    { icon: Zap, title: "Lightning Fast", description: "Instant loading, native app experience", color: "from-amber-500 to-orange-500" },
    { icon: Bell, title: "Push Notifications", description: "Get notified about new tests & results", color: "from-purple-500 to-pink-500" },
    { icon: Shield, title: "Secure & Private", description: "Your data stays safe on your device", color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50/50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/40 to-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-purple-200/25 to-pink-200/25 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col" style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center mb-6 hover:shadow-lg transition-shadow"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </motion.button>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
          >
            <Zap className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2">Install Practice Koro</h1>
          <p className="text-slate-500 text-sm">Get the full native app experience</p>
        </motion.div>

        {/* Already installed message */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-900 mb-1">Already Installed!</h3>
            <p className="text-emerald-600 text-sm">You can open the app from your home screen</p>
            <Button
              onClick={() => navigate("/student/dashboard")}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Dashboard
            </Button>
          </motion.div>
        )}

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-md`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{feature.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Installation instructions based on platform */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1"
          >
            {/* Android/Chrome - Direct install */}
            {(deferredPrompt || isAndroid) && !isIOS && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Chrome className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Install with One Click</h3>
                    <p className="text-sm text-slate-500">Android & Chrome</p>
                  </div>
                </div>
                
                <Button
                  onClick={handleInstall}
                  disabled={!deferredPrompt || installing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl py-6 text-base shadow-xl shadow-indigo-500/25"
                >
                  {installing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Installing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Install App Now
                    </span>
                  )}
                </Button>
                
                {!deferredPrompt && !isIOS && (
                  <p className="text-xs text-center text-slate-400 mt-3">
                    If the button doesn't work, use your browser menu → "Add to Home Screen"
                  </p>
                )}
              </div>
            )}

            {/* iOS Instructions */}
            {isIOS && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Install on iPhone/iPad</h3>
                    <p className="text-sm text-slate-500">Follow these simple steps</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Share className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Step 1: Tap Share</p>
                      <p className="text-xs text-slate-500 mt-0.5">Tap the share button at the bottom of Safari</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Step 2: Add to Home Screen</p>
                      <p className="text-xs text-slate-500 mt-0.5">Scroll down and tap "Add to Home Screen"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Step 3: Tap Add</p>
                      <p className="text-xs text-slate-500 mt-0.5">Confirm by tapping "Add" in the top right</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generic instructions for desktop/other browsers */}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Install from Browser</h3>
                    <p className="text-sm text-slate-500">Works on all devices</p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Look for the install icon in your browser's address bar, or use the browser menu and select "Install App" or "Add to Home Screen".
                </p>
                
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="text-xs text-indigo-700 font-medium">
                    💡 Tip: Open this page on your mobile device for the best installation experience!
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-auto pt-6 text-center"
        >
          <p className="text-xs text-slate-400">
            Practice Koro • Your exam preparation partner
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Install;
