import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

interface SeventhItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeventhItemModal({
  open,
  onOpenChange,
}: SeventhItemModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="seventh-item-modal">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary/10">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
            <DialogTitle className="text-xl" data-testid="text-seventh-item-title">
              {t("home.seventhItemModal.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-3" data-testid="text-seventh-item-description">
            {t("home.seventhItemModal.description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {t("home.seventhItemModal.freePlanInfo")}
          </p>
          
          <p className="text-sm text-muted-foreground">
            {t("home.seventhItemModal.limitInfo")}
          </p>
          
          <p className="text-sm text-foreground font-medium">
            {t("home.seventhItemModal.noChange")}
          </p>
        </div>
        
        <div className="pt-2">
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-seventh-understood"
          >
            {t("home.seventhItemModal.understood")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
