import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterManually: () => void;
}

export default function WelcomeModal({
  open,
  onOpenChange,
  onRegisterManually,
}: WelcomeModalProps) {
  const { t } = useTranslation();
  const ctaClickedRef = useRef(false);
  const shownTrackedRef = useRef(false);

  useEffect(() => {
    if (open) {
      ctaClickedRef.current = false;
      if (!shownTrackedRef.current) {
        shownTrackedRef.current = true;
        apiRequest("POST", "/api/track-event", { eventName: "welcome_modal_shown" }).catch(() => {});
      }
    } else {
      shownTrackedRef.current = false;
    }
  }, [open]);

  const handleCtaClick = () => {
    ctaClickedRef.current = true;
    apiRequest("POST", "/api/track-event", { eventName: "welcome_modal_cta_clicked" }).catch(() => {});
    onRegisterManually();
    handleOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !ctaClickedRef.current && shownTrackedRef.current) {
      apiRequest("POST", "/api/track-event", { eventName: "welcome_modal_closed_without_action" }).catch(() => {});
    }
    if (!newOpen) {
      shownTrackedRef.current = false;
      ctaClickedRef.current = false;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="welcome-modal">
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="text-welcome-title">
            {t("home.welcomeModal.title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2" data-testid="text-welcome-description">
            {t("home.welcomeModal.description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="default"
            onClick={handleCtaClick}
            className="w-full"
            data-testid="button-register-first-kit"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("home.welcomeModal.registerFirstKit")}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground text-center pt-3" data-testid="text-welcome-closing">
          {t("home.welcomeModal.closing")}
        </p>
        
        <p className="text-xs text-muted-foreground text-center pt-1" data-testid="text-welcome-microcopy">
          {t("home.welcomeModal.microcopy")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
