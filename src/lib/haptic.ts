// Haptic Feedback Utility for Premium App Feel
// Works on iOS and Android devices

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

interface NavigatorWithVibrate extends Omit<Navigator, 'vibrate'> {
    vibrate: (pattern: number | number[]) => boolean;
}

// Vibration patterns for different feedback types
const vibrationPatterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 30, 10],
    warning: [20, 10, 20],
    error: [30, 10, 30, 10, 30],
    selection: 5,
};

export const hapticFeedback = (type: HapticType = "light"): void => {
    // Check if Vibration API is available
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        const nav = navigator as NavigatorWithVibrate;
        try {
            nav.vibrate(vibrationPatterns[type]);
        } catch (e) {
            // Silently fail if vibration fails
        }
    }
};

// Touch feedback with visual + haptic
export const touchFeedback = (
    element: HTMLElement,
    type: HapticType = "light"
): void => {
    hapticFeedback(type);

    // Add subtle visual feedback
    element.style.transition = "transform 100ms ease-out";
    element.style.transform = "scale(0.97)";

    setTimeout(() => {
        element.style.transform = "scale(1)";
    }, 100);
};

// Button click with haptic
export const buttonPress = (): void => {
    hapticFeedback("medium");
};

// Success action
export const successFeedback = (): void => {
    hapticFeedback("success");
};

// Error action
export const errorFeedback = (): void => {
    hapticFeedback("error");
};

// Tab/Selection change
export const selectionFeedback = (): void => {
    hapticFeedback("selection");
};

// Hook for components
import { useCallback } from "react";

export const useHaptic = () => {
    const light = useCallback(() => hapticFeedback("light"), []);
    const medium = useCallback(() => hapticFeedback("medium"), []);
    const heavy = useCallback(() => hapticFeedback("heavy"), []);
    const success = useCallback(() => hapticFeedback("success"), []);
    const warning = useCallback(() => hapticFeedback("warning"), []);
    const error = useCallback(() => hapticFeedback("error"), []);
    const selection = useCallback(() => hapticFeedback("selection"), []);

    return {
        light,
        medium,
        heavy,
        success,
        warning,
        error,
        selection,
        trigger: hapticFeedback,
    };
};

export default hapticFeedback;
