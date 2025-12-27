import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Sparkles, Zap } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const hoursSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60);
            if (hoursSinceDismiss < 24) return; // Wait 24 hours before showing again
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after a delay for better UX
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

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
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
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
                                Get instant access, offline support & native app experience!
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-2 mt-4">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Maybe Later
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleInstall}
                            className="flex-1 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Install Now
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
