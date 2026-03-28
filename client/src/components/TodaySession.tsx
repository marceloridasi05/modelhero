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
  // Componente desabilitado - Sessão de hoje removida da home
  return null;
}
