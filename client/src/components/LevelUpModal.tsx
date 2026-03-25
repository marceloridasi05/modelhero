import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Award, Gem, Medal, Sparkles, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LEVEL_DATA: Record<number, { 
  icon: typeof Trophy; 
  color: string; 
  bgGradient: string;
}> = {
  1: { 
    icon: Star, 
    color: "text-gray-600 dark:text-gray-400", 
    bgGradient: "from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
  },
  2: { 
    icon: Medal, 
    color: "text-amber-600", 
    bgGradient: "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
  },
  3: { 
    icon: Award, 
    color: "text-gray-400", 
    bgGradient: "from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
  },
  4: { 
    icon: Trophy, 
    color: "text-yellow-500", 
    bgGradient: "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900"
  },
  5: { 
    icon: Gem, 
    color: "text-cyan-400", 
    bgGradient: "from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900"
  },
};

interface LevelUpModalProps {
  level: number | null;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (level) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [level]);

  if (!level) return null;

  const levelData = LEVEL_DATA[level];
  const Icon = levelData?.icon || Star;
  const isDiamond = level === 5;
  const levelName = t(`gamification.levelNames.${level}`);
  const levelUpTitle = t(`gamification.levelUp.${level}.title`);
  const levelUpDescription = t(`gamification.levelUp.${level}.description`);

  return (
    <Dialog open={!!level} onOpenChange={() => onClose()}>
      <DialogContent 
        className={`sm:max-w-md overflow-hidden ${isDiamond ? 'border-2 border-cyan-400' : ''}`}
        data-testid="level-up-modal"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${levelData?.bgGradient || ''} opacity-50 -z-10`} />
        
        <AnimatePresence>
          {showConfetti && (
            <motion.div 
              className="absolute inset-0 pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(isDiamond ? 20 : 10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    x: Math.random() * 400 - 200,
                    y: -20,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{ 
                    y: 400,
                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                    scale: [0, 1, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2 + Math.random(),
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }}
                  style={{ left: `${10 + Math.random() * 80}%` }}
                >
                  {i % 3 === 0 ? (
                    <Sparkles className={`w-4 h-4 ${levelData?.color}`} />
                  ) : i % 3 === 1 ? (
                    <Star className={`w-3 h-3 ${levelData?.color}`} />
                  ) : (
                    <PartyPopper className={`w-4 h-4 ${levelData?.color}`} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogHeader className="text-center pt-4">
          <motion.div
            className="mx-auto mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className={`p-4 rounded-full bg-background shadow-lg ${isDiamond ? 'ring-4 ring-cyan-400/50' : ''}`}>
              <Icon className={`w-12 h-12 ${levelData?.color}`} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DialogTitle className="text-xl font-bold">
              {levelUpTitle}
            </DialogTitle>
            <p className={`text-lg font-semibold ${levelData?.color} mt-1`}>
              {t("gamification.organizedModeler")} - {levelName}
            </p>
          </motion.div>
        </DialogHeader>

        <motion.div
          className="text-center px-4 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <DialogDescription className="text-sm">
            {levelUpDescription}
          </DialogDescription>
        </motion.div>

        <motion.div
          className="flex justify-center pt-2 pb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button onClick={onClose} data-testid="button-close-level-up">
            {t("common.continue", "Continuar")}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
