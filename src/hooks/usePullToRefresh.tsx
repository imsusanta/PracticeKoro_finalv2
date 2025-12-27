import { useState, useRef, useCallback, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  PullIndicator: React.FC;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const isMobile = useIsMobile();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // Only enable pull-to-refresh when at the top of the page
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) {
      setPullDistance(0);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance to make pull feel natural
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      setPullDistance(0);
      setIsRefreshing(false);
      setIsPulling(false);
    };
  }, []);

  const PullIndicator: React.FC = () => {
    if (!isMobile) return null;
    
    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 360;
    const scale = 0.5 + progress * 0.5;
    const opacity = Math.min(pullDistance / 30, 1);
    
    if (pullDistance === 0 && !isRefreshing) return null;
    
    return (
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-transform duration-200"
        style={{ 
          top: `${Math.min(pullDistance, maxPull) + 60}px`,
          opacity
        }}
      >
        <div 
          className={`w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ 
            transform: `scale(${scale}) rotate(${isRefreshing ? 0 : rotation}deg)`,
          }}
        >
          <svg 
            className={`w-5 h-5 ${isRefreshing ? 'text-indigo-600' : progress >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {isRefreshing ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            )}
          </svg>
        </div>
        {isRefreshing && (
          <p className="text-xs font-medium text-slate-500 mt-2 text-center">Refreshing...</p>
        )}
      </div>
    );
  };

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    PullIndicator,
  };
}
