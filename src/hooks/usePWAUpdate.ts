import { useState, useEffect, useCallback } from 'react';

interface PWAUpdateState {
    updateAvailable: boolean;
    isUpdating: boolean;
    registration: ServiceWorkerRegistration | null;
}

export const usePWAUpdate = () => {
    const [state, setState] = useState<PWAUpdateState>({
        updateAvailable: false,
        isUpdating: false,
        registration: null,
    });

    // Check for updates periodically
    const checkForUpdates = useCallback(() => {
        if (state.registration) {
            state.registration.update();
        }
    }, [state.registration]);

    // Apply update and reload
    const applyUpdate = useCallback(() => {
        if (!state.registration?.waiting) return;

        setState(prev => ({ ...prev, isUpdating: true }));

        // Tell waiting SW to skip waiting
        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }, [state.registration]);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        let refreshing = false;

        // Message listener (already handles SW_UPDATED)
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'SW_UPDATED') {
                console.log('[PWA] Service worker updated to:', event.data.version);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        // Get registration
        navigator.serviceWorker.ready.then((registration) => {
            setState(prev => ({ ...prev, registration }));

            // Check for waiting SW - Just set updateAvailable
            if (registration.waiting) {
                console.log('[PWA] Waiting update found.');
                setState(prev => ({ ...prev, updateAvailable: true }));
            }

            // Listen for new SW installing
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New SW is ready, let the user decide when to update
                        console.log('[PWA] New update installed and waiting.');
                        setState(prev => ({ ...prev, updateAvailable: true }));
                    }
                });
            });
        });

        // Check for updates every 5 minutes
        const interval = setInterval(() => {
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg) reg.update();
            });
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        updateAvailable: state.updateAvailable,
        isUpdating: state.isUpdating,
        checkForUpdates,
        applyUpdate,
    };
};
