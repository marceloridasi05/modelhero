import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

interface FirstKitRegisteredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterAnother: () => void;
  onViewKitDetails: () => void;
}

export function FirstKitRegisteredModal({
  open,
  onOpenChange,
  onRegisterAnother,
  onViewKitDetails,
}: FirstKitRegisteredModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="first-kit-registered-modal">
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="text-first-kit-title">
            {t("home.firstKitModal.title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2" data-testid="text-first-kit-description">
            {t("home.firstKitModal.description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              setTimeout(() => onRegisterAnother(), 150);
            }}
            className="w-full"
            data-testid="button-register-another-kit"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("home.firstKitModal.registerAnother")}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTimeout(() => onViewKitDetails(), 150);
            }}
            className="w-full"
            data-testid="button-view-kit-details"
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("home.firstKitModal.viewKitDetails")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
