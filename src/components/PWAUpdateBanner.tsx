import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles, Clock } from 'lucide-react';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

const DISMISS_KEY = 'pwa_update_dismissed';
const SNOOZE_KEY = 'pwa_update_snoozed_until';
const SNOOZE_DURATION = 60 * 60 * 1000; // 1 hour in ms

export const PWAUpdateBanner = () => {
    const { updateAvailable, isUpdating, applyUpdate } = usePWAUpdate();
    const [isDismissed, setIsDismissed] = useState(false);
    const [isSnoozed, setIsSnoozed] = useState(false);

    // Check if banner should be hidden on mount
    useEffect(() => {
        const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
        const snoozedUntil = localStorage.getItem(SNOOZE_KEY);

        if (dismissed) {
            setIsDismissed(true);
        }

        if (snoozedUntil && Date.now() < parseInt(snoozedUntil)) {
            setIsSnoozed(true);
        } else {
            localStorage.removeItem(SNOOZE_KEY);
        }
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem(DISMISS_KEY, 'true');
    };

    const handleRemindLater = () => {
        const snoozeUntil = Date.now() + SNOOZE_DURATION;
        localStorage.setItem(SNOOZE_KEY, snoozeUntil.toString());
        setIsSnoozed(true);
    };

    if (!updateAvailable || isDismissed || isSnoozed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed top-0 left-0 right-0 z-[9999] px-4 pt-safe-area-top"
            >
                <div className="mt-2 mx-auto max-w-md bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/30 p-4 relative overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-3.5 h-3.5 text-white" />
                    </button>

                    <div className="relative z-10 flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"
                        >
                            <Sparkles className="w-5 h-5 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-white font-semibold text-sm">New Update Available!</p>
                            <p className="text-indigo-200 text-xs">Fresh features & improvements</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="relative z-10 flex gap-2 mt-3">
                        <button
                            onClick={handleRemindLater}
                            className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-white font-medium text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-white/20"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Later
                        </button>
                        <button
                            onClick={applyUpdate}
                            disabled={isUpdating}
                            className="flex-[2] px-4 py-2 rounded-xl bg-white text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 shadow-lg"
                        >
                            {isUpdating ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Update Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
