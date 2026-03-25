import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Star, Award, Gem } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GamificationStatus } from "@shared/schema";

const LEVEL_ICONS: Record<number, typeof Star> = {
  1: Star,
  2: Award,
  3: Award,
  4: Award,
  5: Gem,
};

const LEVEL_COLORS: Record<number, string> = {
  1: "text-gray-400",
  2: "text-amber-600",
  3: "text-gray-300",
  4: "text-yellow-500",
  5: "text-cyan-400",
};

interface GamificationBadgeProps {
  onLevelUp?: (level: number) => void;
}

export function GamificationBadge({ onLevelUp }: GamificationBadgeProps) {
  const { t } = useTranslation();

  const { data: status, isLoading } = useQuery<GamificationStatus>({
    queryKey: ["/api/gamification"],
    refetchInterval: 5000,
  });

  if (isLoading || !status || status.currentLevel === 0) {
    return null;
  }

  const Icon = LEVEL_ICONS[status.currentLevel] || Star;
  const iconColor = LEVEL_COLORS[status.currentLevel] || "text-gray-500";

  const levelNameKey = `gamification.levels.${status.currentLevel}`;
  const levelName = t(levelNameKey);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 cursor-pointer hover-elevate"
          data-testid="gamification-badge"
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <div className="flex flex-col min-w-[140px]">
            <span className="text-xs font-medium leading-tight">
              {t("gamification.organizedModeler")} {levelName}
            </span>
            {!status.isMaxLevel && status.itemsToNextLevel !== null && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                <Progress 
                  value={status.progressPercent} 
                  className="h-1 w-full" 
                />
                <span className="text-[10px] text-muted-foreground">
                  {t("gamification.itemsToNext", { count: status.itemsToNextLevel })}
                </span>
              </div>
            )}
            {status.isMaxLevel && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5 w-fit">
                {t("gamification.maxLevel")}
              </Badge>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[250px]">
        <p className="text-xs">
          <strong>{t("gamification.youAre")} {t("gamification.organizedModeler")} {levelName}</strong>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("gamification.itemsRegistered", { count: status.totalItems })}
        </p>
        {!status.isMaxLevel && status.itemsToNextLevel !== null && (
          <p className="text-xs text-muted-foreground">
            {t("gamification.itemsToNext", { count: status.itemsToNextLevel })}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
