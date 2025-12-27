import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "card" | "avatar" | "button";
    width?: string | number;
    height?: string | number;
    count?: number;
}

const shimmerAnimation = {
    initial: { x: "-100%" },
    animate: { x: "100%" },
    transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut",
    },
};

export const Skeleton = ({
    className,
    variant = "rectangular",
    width,
    height,
    count = 1,
}: SkeletonProps) => {
    const baseClasses = "relative overflow-hidden bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200";

    const variantClasses = {
        text: "h-4 rounded-md",
        circular: "rounded-full aspect-square",
        rectangular: "rounded-xl",
        card: "rounded-2xl min-h-[120px]",
        avatar: "rounded-full w-10 h-10",
        button: "rounded-xl h-10",
    };

    const elements = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={cn(
                baseClasses,
                variantClasses[variant],
                className
            )}
            style={{ width, height }}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                    delay: i * 0.1,
                }}
            />
        </div>
    ));

    return count === 1 ? elements[0] : <>{elements}</>;
};

// Premium Card Skeleton
export const CardSkeleton = ({ className }: { className?: string }) => (
    <div className={cn("p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3", className)}>
        <div className="flex items-center gap-3">
            <Skeleton variant="avatar" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
        </div>
        <Skeleton variant="rectangular" className="h-20" />
        <div className="flex gap-2">
            <Skeleton variant="button" className="flex-1" />
            <Skeleton variant="button" className="w-10" />
        </div>
    </div>
);

// Dashboard Stats Skeleton
export const StatCardSkeleton = () => (
    <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 md:flex-col md:items-start md:gap-3">
            <Skeleton variant="rectangular" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl" />
            <div className="space-y-1.5">
                <Skeleton variant="text" className="w-12 h-3" />
                <Skeleton variant="text" className="w-8 h-5" />
            </div>
        </div>
    </div>
);

// Hero Section Skeleton
export const HeroSkeleton = () => (
    <div className="relative overflow-hidden rounded-[28px] p-4 md:p-6 bg-gradient-to-br from-slate-200 to-slate-300">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton variant="text" className="w-32 h-5" />
                    <Skeleton variant="text" className="w-20 h-3" />
                </div>
            </div>
            <Skeleton variant="circular" className="w-14 h-14 md:w-20 md:h-20" />
        </div>
        <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                    <Skeleton variant="avatar" className="w-5 h-5" />
                    <Skeleton variant="avatar" className="w-5 h-5" />
                    <Skeleton variant="avatar" className="w-5 h-5" />
                </div>
                <Skeleton variant="text" className="w-16 h-3" />
            </div>
            <Skeleton variant="button" className="w-16 h-8" />
        </div>
    </div>
);

// List Item Skeleton
export const ListItemSkeleton = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100"
            >
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-3/4" />
                    <Skeleton variant="text" className="w-1/2 h-3" />
                </div>
                <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
            </motion.div>
        ))}
    </div>
);

export default Skeleton;
