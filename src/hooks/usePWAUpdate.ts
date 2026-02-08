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
            state.registration.update().catch(err => console.error('[PWA] Update check failed:', err));
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

        const setupSW = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                setState(prev => ({ ...prev, registration }));

                // Check for waiting SW
                if (registration.waiting) {
                    console.log('[PWA] Waiting update found.');
                    setState(prev => ({ ...prev, updateAvailable: true }));
                }

                // Listen for new SW installing
                const onUpdateFound = () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New update installed and waiting.');
                            setState(prev => ({ ...prev, updateAvailable: true }));
                        }
                    });
                };

                registration.addEventListener('updatefound', onUpdateFound);

                // Cleanup
                return () => {
                    registration.removeEventListener('updatefound', onUpdateFound);
                };
            } catch (err) {
                console.error('[PWA] Service worker setup failed:', err);
            }
        };

        const cleanup = setupSW();

        // Check for updates every 5 minutes
        const interval = setInterval(() => {
            navigator.serviceWorker.getRegistration().then((reg) => {
                if (reg) reg.update().catch(() => { });
            });
        }, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
            cleanup.then(unsub => unsub?.());
        };
    }, []);

    return {
        updateAvailable: state.updateAvailable,
        isUpdating: state.isUpdating,
        checkForUpdates,
        applyUpdate,
    };
};
