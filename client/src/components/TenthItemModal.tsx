import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Infinity, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentInfo } from "@/lib/paymentInfo";

interface TenthItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenthItemModal({ open, onOpenChange }: TenthItemModalProps) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const paymentInfo = getPaymentInfo(i18n.language);
  const { link: paymentLink, useStripeCheckout, stripePriceId } = paymentInfo;

  const trackUpgradeClick = () => {
    apiRequest("POST", "/api/user/upgrade-click").catch(() => {});
  };

  const handleStripeCheckout = async () => {
    setIsLoading(true);
    trackUpgradeClick();
    try {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {
        priceId: stripePriceId,
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsLoading(false);
    }
  };

  const handleViewItems = () => {
    onOpenChange(false);
    setLocation("/kits");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="tenth-item-modal">
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="text-tenth-item-title">
            {t("home.tenthItemModal.title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2" data-testid="text-tenth-item-description">
            {t("home.tenthItemModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("home.tenthItemModal.continueInfo")}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-sm">{t("home.tenthItemModal.fullPlanAllows")}</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Infinity className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("home.tenthItemModal.features.unlimited")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("home.tenthItemModal.features.noBlocks")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("home.tenthItemModal.features.continuous")}</span>
              </li>
            </ul>
          </div>

          <p className="text-sm font-medium text-foreground">
            {t("home.tenthItemModal.naturalStep")}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {useStripeCheckout ? (
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              onClick={handleStripeCheckout}
              disabled={isLoading}
              data-testid="button-tenth-upgrade"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {isLoading ? t("common.loading") : t("home.tenthItemModal.unlockAccess")}
            </Button>
          ) : (
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              asChild
              data-testid="button-tenth-upgrade"
            >
              <a href={paymentLink} target="_blank" rel="noopener noreferrer" onClick={trackUpgradeClick}>
                <Crown className="w-4 h-4 mr-2" />
                {t("home.tenthItemModal.unlockAccess")}
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleViewItems}
            data-testid="button-tenth-view-items"
          >
            {t("home.tenthItemModal.viewItems")}
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          {t("home.tenthItemModal.microcopy")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
