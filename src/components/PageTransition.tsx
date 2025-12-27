import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

// Premium page transition variants
const pageVariants = {
    initial: {
        opacity: 0,
        y: 8,
        scale: 0.99,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.99,
    },
};

const pageTransition = {
    type: "spring" as const,
    damping: 30,
    stiffness: 400,
};

// Staggered children animation
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 15 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            damping: 25,
            stiffness: 300,
        },
    },
};

// Fade up animation for lists
export const fadeUpItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

// Scale animation for cards
export const scaleItem = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
};

// Slide animation
export const slideIn = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
};

// Premium hover effects
export const hoverScale = {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 400, damping: 25 },
};

export const hoverGlow = {
    whileHover: {
        boxShadow: "0 20px 40px rgba(99, 102, 241, 0.15)",
        y: -4,
    },
    transition: { duration: 0.2 },
};

// Button press animation
export const buttonPress = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring", stiffness: 500, damping: 30 },
};

// Number counting animation hook helper
export const countAnimation = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
};

const PageTransition = ({ children, className }: PageTransitionProps) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

// Animated list wrapper
export const AnimatedList = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => (
    <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className={className}
    >
        {children}
    </motion.div>
);

// Animated list item
export const AnimatedItem = ({
    children,
    index = 0,
    className,
}: {
    children: ReactNode;
    index?: number;
    className?: string;
}) => (
    <motion.div
        variants={staggerItem}
        custom={index}
        className={className}
    >
        {children}
    </motion.div>
);

export default PageTransition;
