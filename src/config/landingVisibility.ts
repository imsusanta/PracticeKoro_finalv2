// Landing page visibility configuration
// Stores which exams and tests should appear on landing page for visitors

const LANDING_VISIBILITY_KEY = "practicekoro_landing_visibility";

interface LandingVisibility {
    exams: { [id: string]: boolean };
    tests: { [id: string]: boolean };
}

// Get visibility config
export const getLandingVisibility = (): LandingVisibility => {
    try {
        const stored = localStorage.getItem(LANDING_VISIBILITY_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading landing visibility:", e);
    }
    return { exams: {}, tests: {} };
};

// Save visibility config
export const saveLandingVisibility = (config: LandingVisibility): void => {
    try {
        localStorage.setItem(LANDING_VISIBILITY_KEY, JSON.stringify(config));
    } catch (e) {
        console.error("Error saving landing visibility:", e);
    }
};

// Check if exam is visible on landing
export const isExamVisibleOnLanding = (examId: string): boolean => {
    const config = getLandingVisibility();
    return config.exams[examId] === true;
};

// Toggle exam visibility on landing
export const toggleExamLandingVisibility = (examId: string): boolean => {
    const config = getLandingVisibility();
    const newValue = !config.exams[examId];
    config.exams[examId] = newValue;
    saveLandingVisibility(config);
    return newValue;
};

// Set exam visibility on landing
export const setExamLandingVisibility = (examId: string, visible: boolean): void => {
    const config = getLandingVisibility();
    config.exams[examId] = visible;
    saveLandingVisibility(config);
};

// Check if test is visible on landing
export const isTestVisibleOnLanding = (testId: string): boolean => {
    const config = getLandingVisibility();
    return config.tests[testId] === true;
};

// Toggle test visibility on landing
export const toggleTestLandingVisibility = (testId: string): boolean => {
    const config = getLandingVisibility();
    const newValue = !config.tests[testId];
    config.tests[testId] = newValue;
    saveLandingVisibility(config);
    return newValue;
};

// Set test visibility on landing
export const setTestLandingVisibility = (testId: string, visible: boolean): void => {
    const config = getLandingVisibility();
    config.tests[testId] = visible;
    saveLandingVisibility(config);
};

// Get all visible exam IDs
export const getVisibleExamIds = (): string[] => {
    const config = getLandingVisibility();
    return Object.keys(config.exams).filter(id => config.exams[id] === true);
};

// Get all visible test IDs
export const getVisibleTestIds = (): string[] => {
    const config = getLandingVisibility();
    return Object.keys(config.tests).filter(id => config.tests[id] === true);
};
