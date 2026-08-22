import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import spotmeLogo from "@/assets/spotme-logo-new.png";
import spotmeWordmark from "@/assets/spotme-wordmark-white.png";

interface SplashScreenProps {
  onComplete: () => void;
  show: boolean;
  /** Minimum delay before showing splash (for slow loads only) */
  minDelayMs?: number;
}

export const SplashScreen = ({ onComplete, show, minDelayMs = 500 }: SplashScreenProps) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!show) {
      setShouldRender(false);
      return;
    }

    // Only show splash if app takes longer than minDelayMs to initialize
    const showTimer = setTimeout(() => {
      setShouldRender(true);
    }, minDelayMs);

    // Complete after showing for a short time
    const completeTimer = setTimeout(() => {
      onComplete();
    }, minDelayMs + 800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [show, onComplete, minDelayMs]);

  // If app loads fast, never show the splash - browser PWA splash is enough
  if (!shouldRender) {
    // Still call onComplete quickly for fast loads
    useEffect(() => {
      if (show && !shouldRender) {
        const timer = setTimeout(() => {
          onComplete();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [show, shouldRender, onComplete]);
    
    return null;
  }

  return (
    <AnimatePresence>
      {show && shouldRender && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <motion.img 
              src={spotmeLogo} 
              alt="SpotMe" 
              className="w-24 h-24"
            />
            <motion.img
              src={spotmeWordmark}
              alt="SpotMe"
              className="h-9 w-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
