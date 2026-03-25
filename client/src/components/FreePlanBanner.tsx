import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Crown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentInfo } from "@/lib/paymentInfo";
import type { User } from "@shared/schema";

export default function FreePlanBanner() {
  const { t, i18n } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentInfo = getPaymentInfo(i18n.language);
  const { link: upgradeLink, useStripeCheckout, stripePriceId } = paymentInfo;

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: usage } = useQuery<{
    totalItems: number;
    limit: number | null;
    canAddItem: boolean;
  }>({
    queryKey: ["/api/usage"],
  });

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

  const isFreeUser = user?.status === "free" && !user?.isAdmin;

  if (!user || !isFreeUser || dismissed) {
    return null;
  }
  const itemsUsed = usage?.totalItems ?? 0;
  const itemsLimit = usage?.limit ?? 10;

  return (
    <div 
      className="bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent border-b border-secondary/20 px-4 py-2"
      data-testid="banner-free-plan"
    >
      <div className="flex items-center justify-between gap-4 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-secondary">
            <Crown className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{t("upgrade.freePlan")}</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {t("upgrade.itemsUsed", { used: itemsUsed, limit: itemsLimit })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {itemsUsed >= 10 && (
            useStripeCheckout ? (
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-white text-xs"
                onClick={handleStripeCheckout}
                disabled={isLoading}
                data-testid="button-upgrade-banner"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Crown className="w-3 h-3 mr-1" />
                )}
                {isLoading ? t("common.loading") : t("upgrade.upgradeNow")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-white text-xs"
                asChild
              >
                <a 
                  href={upgradeLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={trackUpgradeClick}
                  data-testid="button-upgrade-banner"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {t("upgrade.upgradeNow")}
                </a>
              </Button>
            )
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-banner"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
