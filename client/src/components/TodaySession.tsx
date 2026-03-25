import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, CheckCircle2, Brain, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const SESSION_STORAGE_KEY = "modelhero_today_session";

interface SessionState {
  date: string;
  marked: boolean;
  activities: string[];
}

interface WorkbenchDaysResponse {
  workbenchDays: number;
  lastSessionDate: string | null;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getStoredSession(): SessionState | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as SessionState;
    if (parsed.date !== getTodayDate()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(state: SessionState): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

export function TodaySession() {
  const { t } = useTranslation();
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isMarked, setIsMarked] = useState(false);

  const { data: workbenchData } = useQuery<WorkbenchDaysResponse>({
    queryKey: ["/api/user/workbench-days"],
  });

  const markSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/mark-workbench-session", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/workbench-days"] });
    },
  });

  const activities = [
    { id: "assembly", label: t("todaySession.activities.assembly") },
    { id: "painting", label: t("todaySession.activities.painting") },
    { id: "decals", label: t("todaySession.activities.decals") },
    { id: "weathering", label: t("todaySession.activities.weathering") },
    { id: "organizing", label: t("todaySession.activities.organizing") },
  ];

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setIsMarked(stored.marked);
      setSelectedActivities(stored.activities);
    }
  }, []);

  const handleActivityToggle = (activityId: string) => {
    if (isMarked) return;
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleMarkSession = async () => {
    if (selectedActivities.length === 0) return;
    
    const sessionState: SessionState = {
      date: getTodayDate(),
      marked: true,
      activities: selectedActivities,
    };
    saveSession(sessionState);
    setIsMarked(true);
    
    markSessionMutation.mutate();
  };

  const daysSinceLastSession = (() => {
    if (!workbenchData?.lastSessionDate) return null;
    const lastDate = new Date(workbenchData.lastSessionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  })();

  const showInactivityAlert = daysSinceLastSession !== null && daysSinceLastSession > 0 && !isMarked;

  return (
    <Card className="border-accent/30 bg-accent/5" data-testid="card-today-session">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("todaySession.title")}</p>
                <p className="text-sm text-muted-foreground">{t("todaySession.question")}</p>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`activity-${activity.id}`}
                      checked={selectedActivities.includes(activity.id)}
                      onCheckedChange={() => handleActivityToggle(activity.id)}
                      disabled={isMarked}
                      data-testid={`checkbox-activity-${activity.id}`}
                    />
                    <label
                      htmlFor={`activity-${activity.id}`}
                      className={`text-sm cursor-pointer select-none ${isMarked ? 'text-muted-foreground' : 'text-foreground'}`}
                    >
                      {activity.label}
                    </label>
                  </div>
                ))}
              </div>

              {isMarked ? (
                <div className="flex items-center gap-2 text-accent" data-testid="text-session-confirmed">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("todaySession.confirmed")}</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleMarkSession}
                  disabled={selectedActivities.length === 0 || markSessionMutation.isPending}
                  data-testid="button-mark-session"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t("todaySession.markSession")}
                </Button>
              )}
            </div>
          </div>

          {showInactivityAlert && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="flex flex-col items-center justify-center px-6 py-4 bg-destructive/15 rounded-lg border-2 border-destructive/40 cursor-default min-w-[160px] shadow-sm"
                  data-testid="text-workbench-days"
                >
                  <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
                  <span className="text-3xl font-bold text-destructive">{daysSinceLastSession}</span>
                  <span className="text-xs text-destructive/80 text-center font-medium mt-1 leading-tight max-w-[140px]">
                    {t("todaySession.daysAwayLabel")}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t("todaySession.daysAwayTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
