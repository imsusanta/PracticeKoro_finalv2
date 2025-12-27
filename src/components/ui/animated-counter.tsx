import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    decimals?: number;
}

export const AnimatedCounter = ({
    value,
    duration = 1.5,
    suffix = "",
    prefix = "",
    className = "",
    decimals = 0,
}: AnimatedCounterProps) => {
    const spring = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const display = useTransform(spring, (current) =>
        Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals)
    );

    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        const unsubscribe = display.on("change", (v) => {
            setDisplayValue(v);
        });
        return () => unsubscribe();
    }, [display]);

    return (
        <motion.span
            className={className}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {prefix}
            {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}
            {suffix}
        </motion.span>
    );
};

// Percentage counter with progress ring
interface AnimatedPercentageProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    color?: string;
    bgColor?: string;
}

export const AnimatedPercentage = ({
    value,
    size = 60,
    strokeWidth = 6,
    className = "",
    color = "rgb(99, 102, 241)",
    bgColor = "rgba(99, 102, 241, 0.1)",
}: AnimatedPercentageProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const spring = useSpring(0, {
        duration: 1500,
        bounce: 0,
    });

    const strokeDashoffset = useTransform(
        spring,
        [0, 100],
        [circumference, 0]
    );

    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        spring.set(Math.min(value, 100));
    }, [spring, value]);

    useEffect(() => {
        const unsubscribe = strokeDashoffset.on("change", (v) => {
            setOffset(v);
        });
        return () => unsubscribe();
    }, [strokeDashoffset]);

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <AnimatedCounter
                    value={value}
                    suffix="%"
                    className="text-sm font-bold"
                />
            </div>
        </div>
    );
};

// Stats counter with label
interface StatCounterProps {
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    trend?: number;
    className?: string;
}

export const StatCounter = ({
    value,
    label,
    suffix = "",
    prefix = "",
    trend,
    className = "",
}: StatCounterProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center ${className}`}
    >
        <div className="flex items-baseline justify-center gap-1">
            <AnimatedCounter
                value={value}
                prefix={prefix}
                suffix={suffix}
                className="text-2xl md:text-3xl font-black text-slate-900"
            />
            {trend !== undefined && (
                <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`text-xs font-bold ${trend >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                >
                    {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </motion.span>
            )}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
    </motion.div>
);

export default AnimatedCounter;
