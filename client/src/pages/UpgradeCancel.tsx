import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoImage from "@assets/modelhero-logo7_1765889827932.png";

export default function UpgradeCancel() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full" data-testid="card-upgrade-cancel">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <img
            src={logoImage}
            alt="ModelHero"
            className="h-16 w-auto mx-auto"
          />
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <XCircle className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold" data-testid="text-cancel-title">
              {t("upgrade.cancelTitle")}
            </h1>
            <p className="text-muted-foreground" data-testid="text-cancel-description">
              {t("upgrade.cancelDescription")}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/")}
            className="w-full"
            data-testid="button-back-dashboard"
          >
            {t("upgrade.goToDashboard")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
