import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoImage from "@assets/modelhero-logo7_1765889827932.png";

export default function UpgradeSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/");
    }, 8000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full" data-testid="card-upgrade-success">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <img
            src={logoImage}
            alt="ModelHero"
            className="h-16 w-auto mx-auto"
          />
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2" data-testid="text-success-title">
              <Crown className="w-6 h-6 text-yellow-500" />
              {t("upgrade.successTitle")}
            </h1>
            <p className="text-muted-foreground" data-testid="text-success-description">
              {t("upgrade.successDescription")}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/")}
            className="w-full bg-secondary hover:bg-secondary/90 text-white"
            data-testid="button-go-dashboard"
          >
            {t("upgrade.goToDashboard")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("upgrade.autoRedirect")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
