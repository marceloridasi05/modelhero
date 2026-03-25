import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Eye, Clock, Target } from "lucide-react";

interface FifthItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem?: () => void;
}

export function FifthItemModal({
  open,
  onOpenChange,
  onAddItem,
}: FifthItemModalProps) {
  const { t } = useTranslation();

  const handleAddItem = () => {
    onOpenChange(false);
    if (onAddItem) {
      onAddItem();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="fifth-item-modal">
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="text-fifth-item-title">
            {t("home.fifthItemModal.title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2" data-testid="text-fifth-item-description">
            {t("home.fifthItemModal.description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          <p className="text-sm text-foreground">
            {t("home.fifthItemModal.helpIntro")}
          </p>
          
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
              <span>{t("home.fifthItemModal.benefit1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
              <span>{t("home.fifthItemModal.benefit2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Target className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
              <span>{t("home.fifthItemModal.benefit3")}</span>
            </li>
          </ul>
          
          <p className="text-sm font-medium text-foreground pt-1">
            {t("home.fifthItemModal.conclusion")}
          </p>
        </div>
        
        <div className="pt-2 space-y-2">
          <Button
            className="w-full bg-secondary hover:bg-secondary/90 text-white"
            onClick={handleAddItem}
            data-testid="button-fifth-add-item"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("home.fifthItemModal.addMore")}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            asChild
            onClick={() => onOpenChange(false)}
            data-testid="button-fifth-view-kits"
          >
            <Link href="/kits">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("home.fifthItemModal.viewOrganization")}
            </Link>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center pt-1" data-testid="text-fifth-microcopy">
          {t("home.fifthItemModal.microcopy")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
