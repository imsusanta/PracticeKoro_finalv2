import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ExamSecurityConfig {
  onTabSwitch?: (violations: number) => void;
  onFullscreenExit?: (violations: number) => void;
  maxTabViolations?: number;
  maxFullscreenViolations?: number;
  onMaxViolations?: () => void;
}

export const useExamSecurity = (config: ExamSecurityConfig) => {
  const { toast } = useToast();
  const [tabViolations, setTabViolations] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const maxTabViolations = config.maxTabViolations || 3;
  const maxFullscreenViolations = config.maxFullscreenViolations || 3;

  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        title: "Action Blocked",
        description: "Right-click is disabled during the exam.",
        variant: "destructive",
      });
    };

    // Disable copy, cut, paste
    const handleCopyCutPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        title: "Action Blocked",
        description: "Copy/Cut/Paste is disabled during the exam.",
        variant: "destructive",
      });
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        toast({
          title: "Action Blocked",
          description: "Developer tools are disabled during the exam.",
          variant: "destructive",
        });
      }

      // Disable Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
    };

    // Tab visibility detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newViolations = tabViolations + 1;
        setTabViolations(newViolations);
        config.onTabSwitch?.(newViolations);

        if (newViolations >= maxTabViolations) {
          config.onMaxViolations?.();
          toast({
            title: "Test Auto-Submitted",
            description: "Maximum tab switching violations reached. Your test has been submitted.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Warning: Tab Switch Detected",
            description: `Violation ${newViolations}/${maxTabViolations}. ${maxTabViolations - newViolations} remaining before auto-submit.`,
            variant: "destructive",
          });
        }
      }
    };

    // Fullscreen detection
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && fullscreenViolations < maxFullscreenViolations) {
        const newViolations = fullscreenViolations + 1;
        setFullscreenViolations(newViolations);
        config.onFullscreenExit?.(newViolations);

        if (newViolations >= maxFullscreenViolations) {
          config.onMaxViolations?.();
          toast({
            title: "Test Auto-Submitted",
            description: "Maximum fullscreen exit violations reached. Your test has been submitted.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Warning: Fullscreen Exited",
            description: `Violation ${newViolations}/${maxFullscreenViolations}. Please return to fullscreen mode.`,
            variant: "destructive",
          });

          // Auto re-enter fullscreen after 2 seconds
          setTimeout(() => {
            document.documentElement.requestFullscreen();
          }, 2000);
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [tabViolations, fullscreenViolations, maxTabViolations, maxFullscreenViolations, config, toast]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      toast({
        title: "Fullscreen Required",
        description: "Please enable fullscreen mode to start the exam.",
        variant: "destructive",
      });
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  };

  return {
    tabViolations,
    fullscreenViolations,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};
