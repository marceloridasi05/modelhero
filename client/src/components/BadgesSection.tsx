import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Lock } from "lucide-react";
import { 
  computeBadgeProgress, 
  type BadgeProgress,
  type Kit
} from "@/lib/badges";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface BadgesSectionProps {
  kits: Kit[];
  isLoading?: boolean;
}

const tierColors = {
  bronze: "bg-amber-700/20 text-amber-700 dark:bg-amber-600/20 dark:text-amber-500",
  silver: "bg-slate-400/20 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300",
  gold: "bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
};

const tierBorderColors = {
  bronze: "border-amber-700/30 dark:border-amber-600/30",
  silver: "border-slate-400/30 dark:border-slate-400/30",
  gold: "border-yellow-500/30 dark:border-yellow-500/30",
};

function parseProgressText(progressText: string, t: (key: string, options?: Record<string, string | number>) => string): string {
  if (!progressText.includes(":")) return progressText;
  const [key, current, target] = progressText.split(":");
  return t(key, { current, target });
}

function BadgeCard({ badgeProgress, t }: { badgeProgress: BadgeProgress; t: (key: string, options?: Record<string, string | number>) => string }) {
  const { badge, earned, progress, target, progressText } = badgeProgress;
  const Icon = badge.icon;
  const progressPercent = Math.min((progress / target) * 100, 100);
  const translatedProgressText = parseProgressText(progressText, t);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            relative p-3 rounded-md border transition-all
            ${earned 
              ? `${tierBorderColors[badge.tier]} bg-card` 
              : "border-border/50 bg-muted/30 opacity-60"
            }
          `}
          data-testid={`badge-card-${badge.id}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`
                p-2 rounded-md shrink-0
                ${earned ? tierColors[badge.tier] : "bg-muted text-muted-foreground"}
              `}
            >
              {earned ? (
                <Icon className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate" data-testid={`badge-name-${badge.id}`}>
                  {t(badge.name)}
                </span>
                {earned && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-1.5 py-0 ${tierColors[badge.tier]}`}
                  >
                    {t(`home.badges.tiers.${badge.tier}`)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {t(badge.description)}
              </p>
              {!earned && (
                <div className="mt-2 space-y-1">
                  <Progress value={progressPercent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground" data-testid={`badge-progress-${badge.id}`}>
                    {translatedProgressText}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{t(badge.name)}</p>
        <p className="text-xs text-muted-foreground">{t(badge.description)}</p>
        <p className="text-xs mt-1">
          {earned ? t("home.badges.earned") : translatedProgressText}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function BadgesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-3 rounded-md border border-border/50">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-1.5 w-full mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BadgesSection({ kits, isLoading }: BadgesSectionProps) {
  const { t } = useTranslation();
  const badgeProgress = computeBadgeProgress(kits);
  const earnedCount = badgeProgress.filter((bp) => bp.earned).length;
  const totalCount = badgeProgress.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            {t("home.badges.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BadgesSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="badges-section">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5" />
          {t("home.badges.title")}
        </CardTitle>
        <Badge variant="secondary" data-testid="badges-count">
          {earnedCount}/{totalCount}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badgeProgress.map((bp) => (
            <BadgeCard key={bp.badge.id} badgeProgress={bp} t={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
