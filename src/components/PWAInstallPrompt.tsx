import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Sparkles, Share, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSSteps, setShowIOSSteps] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
            if (hoursSinceDismiss < 24) return; // Wait 24 hours before showing again
        }

        // For iOS, show prompt after delay
        if (isIOSDevice) {
            const timer = setTimeout(() => setShowPrompt(true), 4000);
            return () => clearTimeout(timer);
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after a delay for better UX
            setTimeout(() => setShowPrompt(true), 4000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowPrompt(false);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSSteps(true);
            return;
        }

        if (!deferredPrompt) {
            // Fallback: navigate to install page
            navigate("/install");
            return;
        }

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
        setShowPrompt(false);
        setShowIOSSteps(false);
    };

    const handleLearnMore = () => {
        setShowPrompt(false);
        navigate("/install");
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            {showIOSSteps ? (
                // iOS Installation Steps
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-20 left-3 right-3 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-[200]"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>

                        <h3 className="text-base font-bold text-slate-900 mb-4 pr-8">Install on iPhone</h3>

                        <div className="space-y-3 mb-5">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                    <Share className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">1. Tap Share</p>
                                    <p className="text-[10px] text-slate-500">Bottom of Safari</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Plus className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">2. Add to Home Screen</p>
                                    <p className="text-[10px] text-slate-500">Scroll & tap</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                    <ArrowRight className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">3. Tap Add</p>
                                    <p className="text-[10px] text-slate-500">Top right corner</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </motion.div>
            ) : (
                // Main Install Prompt
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-20 left-3 right-3 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-[200]"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-4 shadow-2xl shadow-indigo-500/30 border border-white/10">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400/20 rounded-full blur-xl -ml-12 -mb-12" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>

                        <div className="relative z-10 flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Premium Experience</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">Install Practice Koro</h3>
                                <p className="text-[11px] text-indigo-100 leading-relaxed">
                                    {isIOS 
                                        ? "Add to home screen for the best experience!"
                                        : "Get instant access, offline support & native app experience!"
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-2 mt-4">
                            <button
                                onClick={handleLearnMore}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Learn More
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleInstall}
                                className="flex-1 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
                            >
                                <Download className="w-3.5 h-3.5" />
                                {isIOS ? "How to Install" : "Install Now"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
