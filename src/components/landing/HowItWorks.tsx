import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { UserPlus, Library, LineChart, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const steps = [
    {
        id: 1,
        title: "Register & Get Approved",
        description: "Create your free student account and get quick approval to unlock all Practice Koro features.",
        icon: UserPlus,
        color: "from-blue-500 to-indigo-600",
        shadow: "shadow-blue-500/25",
        delay: 0.2
    },
    {
        id: 2,
        title: "Choose Your Exam & Materials",
        description: "Select your exam category, explore available mock tests, and open study PDFs matched to your syllabus.",
        icon: Library,
        color: "from-emerald-500 to-teal-600",
        shadow: "shadow-emerald-500/25",
        delay: 0.4
    },
    {
        id: 3,
        title: "Practice, Analyse & Improve",
        description: "Take mock tests, review detailed explanations, and track your scores to see steady improvement over time.",
        icon: LineChart,
        color: "from-orange-500 to-red-600",
        shadow: "shadow-orange-500/25",
        delay: 0.6
    }
];

const FloatingBadge = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
    <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        className={className}
    >
        {children}
    </motion.div>
);

const HowItWorks = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const lineHeight = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="py-24 sm:py-32 relative overflow-hidden bg-slate-50/50">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[500px] -right-[500px] w-[1000px] h-[1000px] rounded-full border border-dashed border-slate-300/50"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[200px] -left-[200px] w-[800px] h-[800px] rounded-full border border-dashed border-primary/10"
                    />
                </div>
            </div>

            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-primary/20 uppercase tracking-wider font-medium px-4 py-1.5">
                            Simple Process
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Start Your Journey in <span className="text-primary relative inline-block">
                                3 Steps
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                                </svg>
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            We've streamlined everything so you can focus on what matters most—your preparation and success.
                        </p>
                    </motion.div>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Animated Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2">
                        <motion.div
                            style={{ height: lineHeight }}
                            className="w-full bg-gradient-to-b from-primary via-primary to-primary/0 origin-top shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        />
                    </div>

                    <div className="space-y-24 relative">
                        {steps.map((step, index) => (
                            <StepCard key={step.id} step={step} index={index} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const StepCard = ({ step, index }: { step: typeof steps[0], index: number }) => {
    const isEven = index % 2 === 0;
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <div ref={ref} className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? "" : "md:flex-row-reverse"}`}>
            {/* Text Content */}
            <div className={`flex-1 text-center ${isEven ? "md:text-right" : "md:text-left"}`}>
                <motion.div
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 font-bold text-slate-900 mb-6 md:hidden ring-4 ring-white shadow-lg`}>
                        {step.id}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                    <p className="text-lg text-slate-600 leading-relaxed">{step.description}</p>
                </motion.div>
            </div>

            {/* Icon/Visual Centerpiece */}
            <div className="relative z-10 flex-shrink-0">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={isInView ? { scale: 1, rotate: 0 } : {}}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="relative group"
                >
                    {/* Glowing Background Effect */}
                    <div className={`absolute -inset-4 bg-gradient-to-br ${step.color} opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-opacity duration-500`} />

                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br ${step.color} shadow-2xl ${step.shadow} flex items-center justify-center transform transition-transform duration-300 md:group-hover:scale-110 md:group-hover:rotate-3 border-4 border-white`}>
                        <step.icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>

                    {/* Floating Elements decoration */}
                    <FloatingBadge
                        className="absolute -top-6 -right-6 bg-white p-2 rounded-xl shadow-lg border border-slate-100 hidden md:block"
                        delay={0.5}
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </FloatingBadge>
                </motion.div>
            </div>

            {/* Empty Space for Grid Alignment */}
            <div className="flex-1 hidden md:block" />
        </div>
    );
};

export default HowItWorks;
