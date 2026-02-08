import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Start exit animation after 500ms (reduced for faster loading)
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 500);

        // Complete and unmount after exit animation (reduced for faster loading)
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 800);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50"
                >
                    {/* Background decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-emerald-200/50 to-teal-200/30 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.2, 0.4, 0.2],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-teal-200/40 to-emerald-200/30 rounded-full blur-3xl"
                        />
                    </div>

                    {/* Logo and brand container */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Animated Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                duration: 0.8,
                            }}
                            className="relative mb-6"
                        >
                            {/* Main icon container */}
                            <motion.div
                                className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                >
                                    <Zap className="w-12 h-12 text-white" strokeWidth={2.5} />
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Brand name with staggered animation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                            className="text-center"
                        >
                            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
                                Practice Koro
                            </h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="text-emerald-600 text-sm font-semibold mt-2"
                            >
                                #1 Mock Test Platform
                            </motion.p>
                        </motion.div>

                        {/* Loading indicator */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1, duration: 0.4 }}
                            className="mt-8 flex items-center gap-2"
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                        ease: "easeInOut",
                                    }}
                                    className="w-2 h-2 rounded-full bg-emerald-500"
                                />
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
