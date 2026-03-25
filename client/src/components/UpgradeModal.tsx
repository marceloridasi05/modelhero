import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Package, Infinity, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentInfo } from "@/lib/paymentInfo";
import logoImage from "@assets/modelhero-logo7_1765889827932.png";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const paymentInfo = getPaymentInfo(i18n.language);
  const { originalPrice, promoPrice, currency, link: upgradeLink, labelKey, useStripeCheckout, stripePriceId } = paymentInfo;

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
      <DialogContent className="sm:max-w-md" data-testid="modal-upgrade">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="ModelHero" 
              className="h-16 w-auto"
              data-testid="img-upgrade-logo"
            />
          </div>
          <DialogTitle className="text-xl" data-testid="text-upgrade-title">
            {t("upgrade.limitReached")}
          </DialogTitle>
          <DialogDescription className="text-base" data-testid="text-upgrade-description">
            {t("upgrade.limitDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-center">{t("upgrade.upgradePrompt")}</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Infinity className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("upgrade.features.unlimited")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("upgrade.features.export")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("upgrade.features.storage")}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm">{t("upgrade.features.exclusive")}</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-secondary" data-testid="text-upgrade-promo-label">
              {t(labelKey)}
            </p>
            <p className="text-2xl font-bold text-secondary" data-testid="text-upgrade-price">
              {originalPrice && (
                <span className="text-base line-through text-muted-foreground mr-2">{currency}{originalPrice}</span>
              )}
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
              data-testid="button-upgrade"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {isLoading ? t("common.loading") : t("upgrade.doUpgrade")}
            </Button>
          ) : (
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              asChild
              data-testid="button-upgrade"
            >
              <a href={upgradeLink} target="_blank" rel="noopener noreferrer" onClick={trackUpgradeClick}>
                <Crown className="w-4 h-4 mr-2" />
                {t("upgrade.doUpgrade")}
              </a>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => onOpenChange(false)}
            data-testid="button-close-upgrade"
          >
            {t("upgrade.continueFree")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
