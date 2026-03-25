import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, LayoutGrid, History, Target, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentInfo } from "@/lib/paymentInfo";
import logoImage from "@assets/modelhero-logo7_1765889827932.png";

interface AIUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "photoAI" | "duplicateCheck";
}

export default function AIUpgradeModal({ open, onOpenChange, type }: AIUpgradeModalProps) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const paymentInfo = getPaymentInfo(i18n.language);
  const { promoPrice, currency, link: upgradeLink, labelKey, useStripeCheckout, stripePriceId } = paymentInfo;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid={`dialog-${type}-upgrade`}>
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="ModelHero" 
              className="h-16 w-auto"
              data-testid={`img-${type}-upgrade-logo`}
            />
          </div>
          <DialogTitle className="text-xl" data-testid={`text-${type}-upgrade-title`}>
            {t("aiUpgrade.title")}
          </DialogTitle>
          <DialogDescription className="text-base text-left" data-testid={`text-${type}-upgrade-description`}>
            {t("aiUpgrade.description")}
          </DialogDescription>
          <p className="text-sm text-muted-foreground text-left">
            {t("aiUpgrade.callToAction")}
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium">{t("aiUpgrade.benefitsTitle")}</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("aiUpgrade.benefits.aiUnlimited")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("aiUpgrade.benefits.completeOrganization")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("aiUpgrade.benefits.historyControl")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("aiUpgrade.benefits.seriousHobbyist")}</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-secondary" data-testid={`text-${type}-upgrade-price`}>
              {currency}{promoPrice}
              <span className="text-sm font-normal text-muted-foreground">{t("upgrade.perMonth")}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {useStripeCheckout ? (
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              onClick={handleStripeCheckout}
              disabled={isLoading}
              data-testid={`button-upgrade-${type}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {isLoading ? t("common.loading") : t("aiUpgrade.upgradeButton")}
            </Button>
          ) : (
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              asChild
              data-testid={`button-upgrade-${type}`}
            >
              <a href={upgradeLink} target="_blank" rel="noopener noreferrer" onClick={trackUpgradeClick}>
                <Crown className="w-4 h-4 mr-2" />
                {t("aiUpgrade.upgradeButton")}
              </a>
            </Button>
          )}
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => onOpenChange(false)}
            data-testid={`button-close-${type}-upgrade`}
          >
            {t("upgrade.continueFree")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
