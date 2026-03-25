import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, PartyPopper, CheckCircle, ThumbsUp, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

interface CopyOption {
  icon: typeof Trophy;
  iconColor: string;
  title: string;
  text: string;
  cta: string;
}

interface KitCompletedModalProps {
  open: boolean;
  onClose: () => void;
  isFirstKit: boolean;
  kitName?: string;
}

export function KitCompletedModal({ open, onClose, isFirstKit, kitName }: KitCompletedModalProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [copy, setCopy] = useState<CopyOption | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const getFirstKitCopy = (): CopyOption => ({
    icon: Trophy,
    iconColor: "text-yellow-500",
    title: t("home.kitCompleted.firstKit.title"),
    text: t("home.kitCompleted.firstKit.text"),
    cta: t("home.kitCompleted.firstKit.cta"),
  });

  const getRotationCopies = (): CopyOption[] => [
    {
      icon: PartyPopper,
      iconColor: "text-purple-500",
      title: t("home.kitCompleted.rotation1.title"),
      text: t("home.kitCompleted.rotation1.text"),
      cta: t("home.kitCompleted.rotation1.cta"),
    },
    {
      icon: Trophy,
      iconColor: "text-yellow-500",
      title: t("home.kitCompleted.rotation2.title"),
      text: t("home.kitCompleted.rotation2.text"),
      cta: t("home.kitCompleted.rotation2.cta"),
    },
    {
      icon: CheckCircle,
      iconColor: "text-green-500",
      title: t("home.kitCompleted.rotation3.title"),
      text: t("home.kitCompleted.rotation3.text"),
      cta: t("home.kitCompleted.rotation3.cta"),
    },
    {
      icon: ThumbsUp,
      iconColor: "text-blue-500",
      title: t("home.kitCompleted.rotation4.title"),
      text: t("home.kitCompleted.rotation4.text"),
      cta: t("home.kitCompleted.rotation4.cta"),
    },
    {
      icon: Wrench,
      iconColor: "text-orange-500",
      title: t("home.kitCompleted.rotation5.title"),
      text: t("home.kitCompleted.rotation5.text"),
      cta: t("home.kitCompleted.rotation5.cta"),
    },
  ];

  useEffect(() => {
    if (open) {
      if (isFirstKit) {
        setCopy(getFirstKitCopy());
      } else {
        const rotationCopies = getRotationCopies();
        const lastIndex = parseInt(localStorage.getItem("lastKitCompletedCopyIndex") || "-1");
        let newIndex = Math.floor(Math.random() * rotationCopies.length);
        if (newIndex === lastIndex && rotationCopies.length > 1) {
          newIndex = (newIndex + 1) % rotationCopies.length;
        }
        localStorage.setItem("lastKitCompletedCopyIndex", newIndex.toString());
        setCopy(rotationCopies[newIndex]);
      }
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open, isFirstKit]);

  const handleCTA = () => {
    onClose();
    setLocation("/");
  };

  if (!copy) return null;

  const Icon = copy.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="sm:max-w-md overflow-hidden"
        data-testid="kit-completed-modal"
      >
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: "50%",
                    y: "-10%",
                    scale: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${100 + Math.random() * 20}%`,
                    scale: [0, 1, 1],
                    rotate: Math.random() * 720 - 360,
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    delay: Math.random() * 0.5,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: ["#f9aa00", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444"][
                      Math.floor(Math.random() * 5)
                    ],
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center text-center py-6 relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Icon className={`w-16 h-16 ${copy.iconColor} mb-4`} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-3"
          >
            {copy.title}
          </motion.h2>

          {kitName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mb-2"
            >
              {kitName}
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-6 whitespace-pre-line"
          >
            {copy.text}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleCTA}
              className="bg-[#f9aa00] hover:bg-[#e09800] text-black border-[#e09800]"
              data-testid="button-kit-completed-cta"
            >
              {copy.cta}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
