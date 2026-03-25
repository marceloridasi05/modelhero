import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Users, MessageSquare, Trash2, Send, Pause, Play, KeyRound, RefreshCw, Pencil, Loader2, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, TrendingUp, Clock, Target, Sparkles, Bot, UserX, DollarSign, Settings, Calculator, AlertCircle, Activity, Package, Wallet, CircleDollarSign, Percent, MousePointer, CheckCircle, XCircle, AlertTriangle, Info, Handshake, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserWithKitCounts {
  id: string;
  name: string;
  email: string;
  status: string;
  isPaused: boolean;
  isAdmin: boolean;
  acceptedTerms: boolean;
  acceptedTermsAt: string | null;
  lastLogin: string | null;
  createdAt: string;
  kitCount: number;
  kitsForSaleCount: number;
  upgradeClickCount: number;
  paintCount: number;
  supplyCount: number;
  toolCount: number;
  decalCount: number;
  totalItemsCount: number;
  registrationLanguage: string | null;
  country: string | null;
  profileImage?: string | null;
  excludeFromMetrics?: boolean;
}

interface Message {
  id: string;
  title: string;
  content: string;
  targetUserId: string | null;
  isGlobal: boolean;
  createdAt: string;
}

interface IaUsageDistribution {
  oneAction: number;
  twoToFiveActions: number;
  sixToTwentyActions: number;
  moreThanTwentyActions: number;
}

interface AdminMetrics {
  totalUsers: number;
  totalKits: number;
  averageKitsPerUser: number;
  usersWithAtLeastOneKit: number;
  usersWithTwoOrMoreKits: number;
  averageHoursToFirstKit: number;
  usersAtFreeLimit: number;
  excludedUsersCount: number;
  totalMaterials: number;
  totalItems: number;
  averageItemsPerUser: number;
  usersWithNoItems: number;
  usersActive7Days: number;
  usersActive30Days: number;
  paidUsersCount: number;
  conversionRate: number;
  iaUsersCount: number;
  iaUsersNeverUsedCount: number;
  iaUsersNeverUsedPercentage: number;
  iaActionsTotal: number;
  iaActionsPerUserAverage: number;
  iaUsageDistribution: IaUsageDistribution;
  paidUsersIaCount: number;
  paidUsersIaPercentage: number;
  iaActionsPerPaidUserAverage: number;
  avgDaysToTenItems: number;
  usersWithTenOrMoreItems: number;
  usersWithExactlyOneItem: number;
  signupsBR: number;
  signupsES: number;
  signupsPT: number;
  presenceD1Rate: number;
  presenceD1UsersReturned: number;
  presenceD1UsersTotal: number;
  streakRitualRate: number;
  streakRitualUsers: number;
  streakRitualActiveWeekUsers: number;
  spontaneousActionRate: number;
  spontaneousActionUsers: number;
  spontaneousActionTotalActive: number;
}

interface FunnelStep {
  eventName: string;
  count: number;
}

export default function Admin() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageTargetId, setMessageTargetId] = useState<string | null>(null);
  const [isGlobalMessage, setIsGlobalMessage] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithKitCounts | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<UserWithKitCounts | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [editMessageOpen, setEditMessageOpen] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
  const [editMessageTitle, setEditMessageTitle] = useState("");
  const [editMessageContent, setEditMessageContent] = useState("");
  const [deleteMessageOpen, setDeleteMessageOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [sortColumn, setSortColumn] = useState<'kitCount' | 'kitsForSaleCount' | 'upgradeClickCount' | 'paintCount' | 'supplyCount' | 'toolCount' | 'decalCount' | 'totalItemsCount' | 'createdAt' | 'lastLogin' | null>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState("kpis");
  const [metricsFilter, setMetricsFilter] = useState<'all' | 'included' | 'excluded'>('all');
  
  // Cost settings states
  const [replitMonthlyCost, setReplitMonthlyCost] = useState("");
  const [iaPercentage, setIaPercentage] = useState("");
  const [costPerIaAction, setCostPerIaAction] = useState("");
  const [revenuePerPaidUser, setRevenuePerPaidUser] = useState("4.99");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Financial dashboard states
  const [finCurrency, setFinCurrency] = useState<'USD' | 'BRL'>('USD');
  const [finExchangeRate, setFinExchangeRate] = useState("5.00");
  const [finInfraCost, setFinInfraCost] = useState("25");
  const [finAdsCost, setFinAdsCost] = useState("0");
  const [finVariableCosts, setFinVariableCosts] = useState("0");
  const [finCPC, setFinCPC] = useState("0.50");
  const [finCTR, setFinCTR] = useState("2");
  const [finConversionRate, setFinConversionRate] = useState("2");
  const [finConversions, setFinConversions] = useState(""); // absolute number of conversions
  const [finSimTicket, setFinSimTicket] = useState("4.99");
  const [finTicket, setFinTicket] = useState("4.99");
  const [finPaidUsers, setFinPaidUsers] = useState("");
  
  // Funnel states
  const [funnelPeriod, setFunnelPeriod] = useState<'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom'>('all');
  const [funnelStartDate, setFunnelStartDate] = useState("");
  const [funnelEndDate, setFunnelEndDate] = useState("");
  const [kpiMode, setKpiMode] = useState<'ceo' | 'product'>('ceo');
  const [iaUsageCollapsed, setIaUsageCollapsed] = useState(true);
  const [funnelSiteClicks, setFunnelSiteClicks] = useState("");
  const [funnelSiteClicksBR, setFunnelSiteClicksBR] = useState("");
  const [funnelSiteClicksES, setFunnelSiteClicksES] = useState("");
  const [funnelSiteClicksPT, setFunnelSiteClicksPT] = useState("");
  const [funnelMediaInvestment, setFunnelMediaInvestment] = useState("");
  const [funnelTotalRevenue, setFunnelTotalRevenue] = useState("");
  const [funnelObservations, setFunnelObservations] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  const funnelQueryParams = (() => {
    // Use São Paulo timezone (UTC-3) for consistent "today" calculation
    const saoPauloDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const todayStr = saoPauloDate; // Format: YYYY-MM-DD
    
    if (funnelPeriod === "today") {
      return { startDate: todayStr, endDate: todayStr };
    } else if (funnelPeriod === "yesterday") {
      const yesterday = new Date(todayStr + 'T12:00:00');
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      return { startDate: yesterdayStr, endDate: yesterdayStr };
    } else if (funnelPeriod === "7d") {
      const today = new Date(todayStr + 'T12:00:00');
      today.setDate(today.getDate() - 7);
      const startStr = today.toISOString().split("T")[0];
      return { startDate: startStr, endDate: todayStr };
    } else if (funnelPeriod === "30d") {
      const today = new Date(todayStr + 'T12:00:00');
      today.setDate(today.getDate() - 30);
      const startStr = today.toISOString().split("T")[0];
      return { startDate: startStr, endDate: todayStr };
    } else if (funnelPeriod === "custom" && funnelStartDate && funnelEndDate) {
      return { startDate: funnelStartDate, endDate: funnelEndDate };
    }
    return {};
  })();
  
  const { data: upgradeClicks } = useQuery<{ count: number }>({
    queryKey: ["/api/kpis/upgrade-clicks", funnelQueryParams.startDate, funnelQueryParams.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      const url = params.toString() ? `/api/kpis/upgrade-clicks?${params}` : "/api/kpis/upgrade-clicks";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch upgrade clicks");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: funnelData, isLoading: funnelLoading } = useQuery<FunnelStep[]>({
    queryKey: ["/api/kpis/funnel", funnelQueryParams.startDate, funnelQueryParams.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      const url = params.toString() ? `/api/kpis/funnel?${params}` : "/api/kpis/funnel";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch funnel");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/admin/messages"],
    enabled: !!user?.isAdmin,
  });

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics", funnelQueryParams.startDate, funnelQueryParams.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      const url = params.toString() ? `/api/admin/metrics?${params}` : "/api/admin/metrics";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserWithKitCounts[]>({
    queryKey: ["/api/admin/users", funnelQueryParams.startDate, funnelQueryParams.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      const url = params.toString() ? `/api/admin/users?${params}` : "/api/admin/users";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: adminSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    enabled: !!user?.isAdmin,
  });

  const { data: welcomeModalStats } = useQuery<{ 
    shown: number; 
    ctaClicked: number; 
    closedWithoutAction: number;
    es: { shown: number; ctaClicked: number; closedWithoutAction: number };
    pt: { shown: number; ctaClicked: number; closedWithoutAction: number };
    br: { shown: number; ctaClicked: number; closedWithoutAction: number };
  }>({
    queryKey: ["/api/admin/welcome-modal-stats", funnelQueryParams.startDate, funnelQueryParams.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      const url = params.toString() ? `/api/admin/welcome-modal-stats?${params}` : "/api/admin/welcome-modal-stats";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch welcome modal stats");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: funnelDataBR, isLoading: funnelLoadingBR } = useQuery<FunnelStep[]>({
    queryKey: ["/api/kpis/funnel", funnelQueryParams.startDate, funnelQueryParams.endDate, "country-BR"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      params.append("country", "BR");
      const url = `/api/kpis/funnel?${params}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch funnel BR");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: funnelDataES, isLoading: funnelLoadingES } = useQuery<FunnelStep[]>({
    queryKey: ["/api/kpis/funnel", funnelQueryParams.startDate, funnelQueryParams.endDate, "country-ES"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      params.append("country", "ES");
      const url = `/api/kpis/funnel?${params}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch funnel ES");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: funnelDataPT, isLoading: funnelLoadingPT } = useQuery<FunnelStep[]>({
    queryKey: ["/api/kpis/funnel", funnelQueryParams.startDate, funnelQueryParams.endDate, "country-PT"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (funnelQueryParams.startDate) params.append("startDate", funnelQueryParams.startDate);
      if (funnelQueryParams.endDate) params.append("endDate", funnelQueryParams.endDate);
      params.append("country", "PT");
      const url = `/api/kpis/funnel?${params}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch funnel PT");
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  useEffect(() => {
    if (adminSettings && !settingsLoaded) {
      if (adminSettings.replitMonthlyCost) setReplitMonthlyCost(adminSettings.replitMonthlyCost);
      if (adminSettings.iaPercentage) setIaPercentage(adminSettings.iaPercentage);
      if (adminSettings.costPerIaAction) setCostPerIaAction(adminSettings.costPerIaAction);
      if (adminSettings.revenuePerPaidUser) setRevenuePerPaidUser(adminSettings.revenuePerPaidUser);
      // Financial dashboard settings
      if (adminSettings.finExchangeRate) setFinExchangeRate(adminSettings.finExchangeRate);
      if (adminSettings.finInfraCost) setFinInfraCost(adminSettings.finInfraCost);
      if (adminSettings.finAdsCost) setFinAdsCost(adminSettings.finAdsCost);
      if (adminSettings.finVariableCosts) setFinVariableCosts(adminSettings.finVariableCosts);
      if (adminSettings.finCPC) setFinCPC(adminSettings.finCPC);
      if (adminSettings.finCTR) setFinCTR(adminSettings.finCTR);
      if (adminSettings.finConversionRate) setFinConversionRate(adminSettings.finConversionRate);
      if (adminSettings.finConversions) setFinConversions(adminSettings.finConversions);
      if (adminSettings.finSimTicket) setFinSimTicket(adminSettings.finSimTicket);
      if (adminSettings.finTicket) setFinTicket(adminSettings.finTicket);
      if (adminSettings.finPaidUsers) setFinPaidUsers(adminSettings.finPaidUsers);
      if (adminSettings.finCurrency) setFinCurrency(adminSettings.finCurrency as 'USD' | 'BRL');
      setSettingsLoaded(true);
    }
  }, [adminSettings, settingsLoaded]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const response = await apiRequest("POST", "/api/admin/settings", { settings });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: t("admin.settings.saved", "Configurações salvas") });
    },
    onError: () => {
      toast({ title: t("admin.settings.saveError", "Erro ao salvar configurações"), variant: "destructive" });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      replitMonthlyCost,
      iaPercentage,
      costPerIaAction,
      revenuePerPaidUser,
    });
  };

  // Cost calculations
  const calculateCosts = () => {
    const replitCost = parseFloat(replitMonthlyCost) || 0;
    const iaPercent = parseFloat(iaPercentage) || 0;
    const costPerAction = parseFloat(costPerIaAction) || 0;
    const revenue = parseFloat(revenuePerPaidUser) || 0;
    const iaActionsTotal = metrics?.iaActionsTotal || 0;
    const paidUsersIaCount = metrics?.paidUsersIaCount || 0;

    const estimatedIaCost = iaActionsTotal * costPerAction;
    const costPerPaidUser = paidUsersIaCount > 0 ? estimatedIaCost / paidUsersIaCount : 0;
    const marginPerPaidUser = revenue - costPerPaidUser;
    const replitIaCost = replitCost * (iaPercent / 100);

    return {
      iaActionsTotal,
      estimatedIaCost,
      costPerPaidUser,
      revenue,
      marginPerPaidUser,
      replitIaCost,
      marginPercentage: revenue > 0 ? ((marginPerPaidUser / revenue) * 100) : 0,
    };
  };

  const costs = calculateCosts();

  const filteredUsers = users.filter(u => {
    if (metricsFilter === 'all') return true;
    if (metricsFilter === 'included') return !u.excludeFromMetrics;
    if (metricsFilter === 'excluded') return u.excludeFromMetrics;
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortColumn) return 0;
    
    if (sortColumn === 'createdAt' || sortColumn === 'lastLogin') {
      const aDate = a[sortColumn] ? new Date(a[sortColumn]!).getTime() : 0;
      const bDate = b[sortColumn] ? new Date(b[sortColumn]!).getTime() : 0;
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    const aVal = a[sortColumn] || 0;
    const bVal = b[sortColumn] || 0;
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const includedUsersCount = users.filter(u => !u.excludeFromMetrics).length;
  const excludedUsersCount = users.filter(u => u.excludeFromMetrics).length;

  const handleSort = (column: 'kitCount' | 'kitsForSaleCount' | 'upgradeClickCount' | 'paintCount' | 'supplyCount' | 'toolCount' | 'decalCount' | 'totalItemsCount' | 'createdAt' | 'lastLogin') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("admin.users.statusUpdated") });
    },
    onError: () => {
      toast({ title: t("admin.users.errorUpdatingStatus"), variant: "destructive" });
    },
  });

  const updatePauseMutation = useMutation({
    mutationFn: async ({ userId, isPaused }: { userId: string; isPaused: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/pause`, { isPaused });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("admin.users.userUpdated") });
    },
    onError: () => {
      toast({ title: t("admin.users.errorUpdatingUser"), variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("admin.users.userDeleted") });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast({ title: t("admin.users.errorDeletingUser"), variant: "destructive" });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin });
      return response.json();
    },
    onSuccess: (_, { isAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: isAdmin ? t("admin.users.promotedToAdmin") : t("admin.users.adminRemoved") });
    },
    onError: () => {
      toast({ title: t("admin.users.errorUpdatingAdmin"), variant: "destructive" });
    },
  });

  const updateExcludeMetricsMutation = useMutation({
    mutationFn: async ({ userId, excludeFromMetrics }: { userId: string; excludeFromMetrics: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/exclude-metrics`, { excludeFromMetrics });
      return response.json();
    },
    onSuccess: (_, { excludeFromMetrics }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
      toast({ 
        title: excludeFromMetrics 
          ? t("admin.users.excludedFromMetrics", "Usuário excluído das métricas") 
          : t("admin.users.includedInMetrics", "Usuário incluído nas métricas") 
      });
    },
    onError: () => {
      toast({ title: t("admin.users.errorUpdatingUser"), variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; targetUserId: string | null; isGlobal: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/messages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({ title: t("admin.messages.sent") });
      setMessageOpen(false);
      setMessageTitle("");
      setMessageContent("");
      setMessageTargetId(null);
      setIsGlobalMessage(true);
    },
    onError: () => {
      toast({ title: t("admin.messages.errorSending"), variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/reset-password`, { newPassword });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t("admin.resetPassword.success") });
      setResetPasswordOpen(false);
      setUserToReset(null);
      setNewPassword("");
    },
    onError: () => {
      toast({ title: t("admin.resetPassword.error"), variant: "destructive" });
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: async ({ messageId, title, content }: { messageId: string; title: string; content: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/messages/${messageId}`, { title, content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({ title: t("admin.messages.updated") });
      setEditMessageOpen(false);
      setMessageToEdit(null);
      setEditMessageTitle("");
      setEditMessageContent("");
    },
    onError: () => {
      toast({ title: t("admin.messages.errorUpdating"), variant: "destructive" });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("DELETE", `/api/admin/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      toast({ title: t("admin.messages.deleted") });
      setDeleteMessageOpen(false);
      setMessageToDelete(null);
    },
    onError: () => {
      toast({ title: t("admin.messages.errorDeleting"), variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({ title: t("admin.messages.fillTitleAndContent"), variant: "destructive" });
      return;
    }
    if (!isGlobalMessage && !messageTargetId) {
      toast({ title: t("admin.messages.selectUserToSend"), variant: "destructive" });
      return;
    }
    sendMessageMutation.mutate({
      title: messageTitle,
      content: messageContent,
      targetUserId: isGlobalMessage ? null : messageTargetId,
      isGlobal: isGlobalMessage,
    });
  };

  const confirmDeleteUser = (u: UserWithKitCounts) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const openResetPassword = (u: UserWithKitCounts) => {
    setUserToReset(u);
    setNewPassword("");
    setResetPasswordOpen(true);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ title: t("admin.resetPassword.minLength"), variant: "destructive" });
      return;
    }
    if (userToReset) {
      resetPasswordMutation.mutate({ userId: userToReset.id, newPassword });
    }
  };

  const openEditMessage = (m: Message) => {
    setMessageToEdit(m);
    setEditMessageTitle(m.title);
    setEditMessageContent(m.content);
    setEditMessageOpen(true);
  };

  const handleEditMessage = () => {
    if (!editMessageTitle.trim() || !editMessageContent.trim()) {
      toast({ title: t("admin.messages.fillTitleAndContent"), variant: "destructive" });
      return;
    }
    if (messageToEdit) {
      updateMessageMutation.mutate({ messageId: messageToEdit.id, title: editMessageTitle, content: editMessageContent });
    }
  };

  const confirmDeleteMessage = (m: Message) => {
    setMessageToDelete(m);
    setDeleteMessageOpen(true);
  };

  const handleRefresh = () => {
    refetchUsers();
    refetchMessages();
    refetchMetrics();
    toast({ title: t("admin.dataRefreshed") });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t("admin.users.never");
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return t("admin.users.invalidDate");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-green-600 text-white">{t("admin.status.paid")}</Badge>;
      case "tester":
        return <Badge className="bg-blue-600 text-white">{t("admin.status.tester")}</Badge>;
      default:
        return <Badge variant="secondary">{t("admin.status.free")}</Badge>;
    }
  };

  if (authLoading || usersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="p-4 pb-20 md:pb-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-admin-title">
              {t("admin.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.subtitle")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("admin.refresh")}
          </Button>
          <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-send-message">
                <MessageSquare className="w-4 h-4 mr-2" />
                {t("admin.messages.sendMessage")}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.messages.sendMessage")}</DialogTitle>
              <DialogDescription>
                {t("admin.messages.sendToUsers")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="global" 
                  checked={isGlobalMessage} 
                  onCheckedChange={setIsGlobalMessage}
                  data-testid="switch-global-message"
                />
                <Label htmlFor="global">{t("admin.messages.globalMessage")}</Label>
              </div>
              
              {!isGlobalMessage && (
                <div className="space-y-2">
                  <Label>{t("admin.users.name")}</Label>
                  <Select value={messageTargetId || ""} onValueChange={setMessageTargetId}>
                    <SelectTrigger data-testid="select-target-user">
                      <SelectValue placeholder={t("admin.messages.selectUser")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>{t("admin.messages.messageTitle")}</Label>
                <Input 
                  value={messageTitle} 
                  onChange={e => setMessageTitle(e.target.value)} 
                  placeholder={t("admin.messages.messageTitlePlaceholder")}
                  data-testid="input-message-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("admin.messages.messageContent")}</Label>
                <Textarea 
                  value={messageContent} 
                  onChange={e => setMessageContent(e.target.value)} 
                  placeholder={t("admin.messages.messageContentPlaceholder")}
                  rows={4}
                  data-testid="input-message-content"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending} data-testid="button-confirm-send">
                <Send className="w-4 h-4 mr-2" />
                {t("admin.messages.send")}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="kpis" className="flex items-center gap-2" data-testid="tab-kpis">
            <BarChart3 className="w-4 h-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-2" data-testid="tab-financeiro">
            <Wallet className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2" data-testid="tab-admin">
            <Users className="w-4 h-4" />
            {t("admin.tabs.administration", "Administração")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-6">
          {/* Global Controls: Mode Toggle + Period Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={kpiMode === 'ceo' ? 'default' : 'outline'}
                onClick={() => setKpiMode('ceo')}
                data-testid="button-ceo-mode"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                CEO Mode
              </Button>
              <Button
                size="sm"
                variant={kpiMode === 'product' ? 'default' : 'outline'}
                onClick={() => setKpiMode('product')}
                data-testid="button-product-mode"
              >
                <Target className="w-4 h-4 mr-1" />
                Product Mode
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={funnelPeriod} onValueChange={(v) => setFunnelPeriod(v as 'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom')}>
                <SelectTrigger className="w-44" data-testid="select-global-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t("admin.funnel.today", "Hoje")}</SelectItem>
                  <SelectItem value="yesterday">{t("admin.funnel.yesterday", "Ontem")}</SelectItem>
                  <SelectItem value="7d">{t("admin.funnel.last7Days", "Últimos 7 dias")}</SelectItem>
                  <SelectItem value="30d">{t("admin.funnel.last30Days", "Últimos 30 dias")}</SelectItem>
                  <SelectItem value="all">{t("admin.funnel.allTime", "Todo período")}</SelectItem>
                  <SelectItem value="custom">{t("admin.funnel.custom", "Personalizado")}</SelectItem>
                </SelectContent>
              </Select>
              {funnelPeriod === "custom" && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={funnelStartDate} 
                    onChange={e => setFunnelStartDate(e.target.value)}
                    className="w-36"
                    data-testid="input-global-start"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input 
                    type="date" 
                    value={funnelEndDate} 
                    onChange={e => setFunnelEndDate(e.target.value)}
                    className="w-36"
                    data-testid="input-global-end"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ======================== CEO MODE ======================== */}
          {kpiMode === 'ceo' && (
            <>
              {/* BLOCO 1: KPIs Executivos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t("admin.ceo.executiveKpis", "KPIs Executivos")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : metrics ? (
                    <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-total-users">{metrics.totalUsers}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.signupsInPeriod", "Cadastros no período")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Package className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-users-one-plus-items">{metrics.usersWithAtLeastOneKit}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.usersWithOnePlusItems", "Com 1+ itens cadastrados")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-activated">
                          {funnelData?.find(s => s.eventName === "kit_created_5")?.count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.activatedUsers", "Usuários ativados (5+ kits)")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-conversions">{metrics.paidUsersCount}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.paidConversions", "Conversões pagas")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CircleDollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-revenue">
                          {funnelTotalRevenue ? `R$ ${parseFloat(funnelTotalRevenue).toFixed(2)}` : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.revenueInPeriod", "Receita no período")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-users-one-item">{metrics.usersWithExactlyOneItem}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.usersWithOneItem", "Com apenas 1 item")}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Globe className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-signups-br">{metrics?.signupsBR || 0}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.signupsBR", "Cadastros BR")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Globe className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-signups-pt">{metrics?.signupsPT || 0}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.signupsPT", "Cadastros PT")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-signups-us">{users.filter(u => u.country === 'US').length}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.signupsUS", "Cadastros US")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Globe className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="text-2xl font-bold" data-testid="ceo-signups-es">{metrics?.signupsES || 0}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.ceo.signupsES", "Cadastros ES")}</div>
                      </div>
                    </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("admin.metrics.noData", "Sem dados")}</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 2: Funil de Conversão Completo */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {t("admin.kpis.funnelComplete", "Funil de Conversão Completo")}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/admin/backfill-funnel-events", {
                          method: "POST",
                          credentials: "include",
                        });
                        const data = await res.json();
                        if (res.ok) {
                          toast({
                            title: t("admin.funnel.backfillSuccess", "Eventos criados"),
                            description: `${data.results.signups} cadastros, ${data.results.kit1} primeiro kit, ${data.results.kit3} uso inicial, ${data.results.kit5} ativação`,
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/kpis/funnel"] });
                        } else {
                          toast({ title: "Erro", description: data.error, variant: "destructive" });
                        }
                      } catch (err) {
                        toast({ title: "Erro", description: "Falha ao popular eventos", variant: "destructive" });
                      }
                    }}
                    data-testid="button-backfill-funnel"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {t("admin.funnel.backfill", "Popular Retroativos")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dados Externos (Manual) */}
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      {t("admin.funnel.externalData", "Dados Externos (Manual)")}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.funnel.siteClicks", "Cliques no Site (Yandex/Analytics)")}</Label>
                        <Input 
                          type="number" 
                          value={funnelSiteClicks} 
                          onChange={e => setFunnelSiteClicks(e.target.value)}
                          placeholder="0"
                          data-testid="input-funnel-clicks"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.funnel.mediaInvestment", "Investimento em Mídia (R$)")}</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={funnelMediaInvestment} 
                          onChange={e => setFunnelMediaInvestment(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-funnel-media"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.funnel.totalRevenue", "Receita Total no Período (R$)")}</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={funnelTotalRevenue} 
                          onChange={e => setFunnelTotalRevenue(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-funnel-revenue"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("admin.funnel.observations", "Observações Estratégicas")}</Label>
                      <Textarea 
                        value={funnelObservations} 
                        onChange={e => setFunnelObservations(e.target.value)}
                        placeholder={t("admin.funnel.observationsPlaceholder", "Anotações sobre campanha, testes, aprendizados...")}
                        className="min-h-[60px] text-sm resize-y"
                        data-testid="input-funnel-observations"
                      />
                    </div>
                  </div>

                  {/* Visualização do Funil */}
                  {funnelLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : funnelData && funnelData.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const funnelLabels: Record<string, string> = {
                          ad_click: t("admin.funnel.adClick", "Cliques no Site"),
                          sign_up: t("admin.funnel.signUp", "Cadastro"),
                          kit_created_1: t("admin.funnel.kit1", "Primeiro Kit"),
                          kit_created_3: t("admin.funnel.kit3", "Uso Inicial (3)"),
                          kit_created_5: t("admin.funnel.kit5", "Ativação (5)"),
                          kit_created_7: t("admin.funnel.kit7", "Pré-upgrade (7)"),
                          kit_created_10: t("admin.funnel.kit10", "Gatilho (10)"),
                          upgrade_pro: t("admin.funnel.upgradePro", "Conversão Paga"),
                        };
                        
                        const manualClicks = parseInt(funnelSiteClicks) || 0;
                        const processedFunnelData = funnelData.map(step => 
                          step.eventName === "ad_click" && manualClicks > 0 
                            ? { ...step, count: manualClicks }
                            : step
                        );
                        
                        const maxCount = Math.max(...processedFunnelData.map(s => s.count), 1);
                        const firstNonZeroIdx = processedFunnelData.findIndex(s => s.count > 0);
                        const baseCount = firstNonZeroIdx >= 0 ? processedFunnelData[firstNonZeroIdx].count : 0;
                        
                        return processedFunnelData.map((step, idx) => {
                          const prevCount = idx === 0 ? step.count : processedFunnelData[idx - 1].count;
                          const dropoff = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100).toFixed(1) : "0";
                          const conversionFromBase = baseCount > 0 ? ((step.count / baseCount) * 100).toFixed(1) : "0";
                          const widthPercent = (step.count / maxCount) * 100;
                          const isManualEntry = step.eventName === "ad_click" && manualClicks > 0;
                          
                          return (
                            <div key={step.eventName} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium flex items-center gap-1">
                                  {funnelLabels[step.eventName] || step.eventName}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">{step.count}</span>
                                  {idx > 0 && prevCount > 0 && step.count < prevCount && (
                                    <span className="text-xs text-destructive">
                                      -{dropoff}%
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground w-14 text-right">
                                    ({conversionFromBase}%)
                                  </span>
                                </div>
                              </div>
                              <div className="h-6 bg-muted rounded-md overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-500"
                                  style={{ width: `${widthPercent}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                      
                      <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            {t("admin.funnel.overallConversion", "Conversão geral")}: {" "}
                            <span className="font-bold text-foreground">
                              {(() => {
                                const firstNonZero = funnelData.find(s => s.count > 0);
                                const lastStep = funnelData[funnelData.length - 1];
                                return firstNonZero && firstNonZero.count > 0 
                                  ? ((lastStep?.count || 0) / firstNonZero.count * 100).toFixed(2)
                                  : "0";
                              })()}%
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      {t("admin.funnel.noData", "Ainda não há dados de funil.")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 2.0: Funil de Conversão - BR */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    <span className="flex items-center gap-2">
                      {t("admin.kpis.funnelBR", "Funil de Conversão - BR")}
                      <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300">BR</Badge>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t("admin.funnel.siteClicks", "Cliques no Site (Yandex/Analytics)")}</Label>
                    <Input 
                      type="number" 
                      value={funnelSiteClicksBR} 
                      onChange={e => setFunnelSiteClicksBR(e.target.value)}
                      placeholder="0"
                      data-testid="input-funnel-clicks-br"
                    />
                  </div>
                  {funnelLoadingBR ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : funnelDataBR && funnelDataBR.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const funnelLabels: Record<string, string> = {
                          ad_click: t("admin.funnel.adClick", "Cliques no Site"),
                          sign_up: t("admin.funnel.signUp", "Cadastro"),
                          kit_created_1: t("admin.funnel.kit1", "Primeiro Kit"),
                          kit_created_3: t("admin.funnel.kit3", "Uso Inicial (3)"),
                          kit_created_5: t("admin.funnel.kit5", "Ativação (5)"),
                          kit_created_7: t("admin.funnel.kit7", "Pré-upgrade (7)"),
                          kit_created_10: t("admin.funnel.kit10", "Gatilho (10)"),
                          upgrade_pro: t("admin.funnel.upgradePro", "Conversão Paga"),
                        };
                        
                        const manualClicksBR = parseInt(funnelSiteClicksBR) || 0;
                        const processedFunnelDataBR = funnelDataBR.map(step => 
                          step.eventName === "ad_click" && manualClicksBR > 0 
                            ? { ...step, count: manualClicksBR }
                            : step
                        );
                        
                        const maxCount = Math.max(...processedFunnelDataBR.map(s => s.count), 1);
                        const firstNonZeroIdx = processedFunnelDataBR.findIndex(s => s.count > 0);
                        const baseCount = firstNonZeroIdx >= 0 ? processedFunnelDataBR[firstNonZeroIdx].count : 0;
                        
                        return processedFunnelDataBR.map((step, idx) => {
                          const prevCount = idx === 0 ? step.count : processedFunnelDataBR[idx - 1].count;
                          const dropoff = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100).toFixed(1) : "0";
                          const conversionFromBase = baseCount > 0 ? ((step.count / baseCount) * 100).toFixed(1) : "0";
                          const widthPercent = (step.count / maxCount) * 100;
                          
                          return (
                            <div key={step.eventName} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{funnelLabels[step.eventName] || step.eventName}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">{step.count}</span>
                                  {idx > 0 && prevCount > 0 && step.count < prevCount && (
                                    <span className="text-xs text-destructive">-{dropoff}%</span>
                                  )}
                                  <span className="text-xs text-muted-foreground w-14 text-right">({conversionFromBase}%)</span>
                                </div>
                              </div>
                              <div className="h-4 bg-muted rounded-md overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${widthPercent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("admin.funnel.noData", "Ainda não há dados de funil.")}</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 2.1: Funil de Conversão - ES */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    <span className="flex items-center gap-2">
                      {t("admin.kpis.funnelES", "Funil de Conversão - ES")}
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300">ES</Badge>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t("admin.funnel.siteClicks", "Cliques no Site (Yandex/Analytics)")}</Label>
                    <Input 
                      type="number" 
                      value={funnelSiteClicksES} 
                      onChange={e => setFunnelSiteClicksES(e.target.value)}
                      placeholder="0"
                      data-testid="input-funnel-clicks-es"
                    />
                  </div>
                  {funnelLoadingES ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : funnelDataES && funnelDataES.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const funnelLabels: Record<string, string> = {
                          ad_click: t("admin.funnel.adClick", "Cliques no Site"),
                          sign_up: t("admin.funnel.signUp", "Cadastro"),
                          kit_created_1: t("admin.funnel.kit1", "Primeiro Kit"),
                          kit_created_3: t("admin.funnel.kit3", "Uso Inicial (3)"),
                          kit_created_5: t("admin.funnel.kit5", "Ativação (5)"),
                          kit_created_7: t("admin.funnel.kit7", "Pré-upgrade (7)"),
                          kit_created_10: t("admin.funnel.kit10", "Gatilho (10)"),
                          upgrade_pro: t("admin.funnel.upgradePro", "Conversão Paga"),
                        };
                        
                        const manualClicksES = parseInt(funnelSiteClicksES) || 0;
                        const processedFunnelDataES = funnelDataES.map(step => 
                          step.eventName === "ad_click" && manualClicksES > 0 
                            ? { ...step, count: manualClicksES }
                            : step
                        );
                        
                        const maxCount = Math.max(...processedFunnelDataES.map(s => s.count), 1);
                        const firstNonZeroIdx = processedFunnelDataES.findIndex(s => s.count > 0);
                        const baseCount = firstNonZeroIdx >= 0 ? processedFunnelDataES[firstNonZeroIdx].count : 0;
                        
                        return processedFunnelDataES.map((step, idx) => {
                          const prevCount = idx === 0 ? step.count : processedFunnelDataES[idx - 1].count;
                          const dropoff = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100).toFixed(1) : "0";
                          const conversionFromBase = baseCount > 0 ? ((step.count / baseCount) * 100).toFixed(1) : "0";
                          const widthPercent = (step.count / maxCount) * 100;
                          
                          return (
                            <div key={step.eventName} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{funnelLabels[step.eventName] || step.eventName}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">{step.count}</span>
                                  {idx > 0 && prevCount > 0 && step.count < prevCount && (
                                    <span className="text-xs text-destructive">-{dropoff}%</span>
                                  )}
                                  <span className="text-xs text-muted-foreground w-14 text-right">({conversionFromBase}%)</span>
                                </div>
                              </div>
                              <div className="h-4 bg-muted rounded-md overflow-hidden">
                                <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${widthPercent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("admin.funnel.noData", "Ainda não há dados de funil.")}</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 2.2: Funil de Conversão - PT */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    <span className="flex items-center gap-2">
                      {t("admin.kpis.funnelPT", "Funil de Conversão - PT")}
                      <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300">PT</Badge>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t("admin.funnel.siteClicks", "Cliques no Site (Yandex/Analytics)")}</Label>
                    <Input 
                      type="number" 
                      value={funnelSiteClicksPT} 
                      onChange={e => setFunnelSiteClicksPT(e.target.value)}
                      placeholder="0"
                      data-testid="input-funnel-clicks-pt"
                    />
                  </div>
                  {funnelLoadingPT ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : funnelDataPT && funnelDataPT.length > 0 ? (
                    <div className="space-y-3">
                      {(() => {
                        const funnelLabels: Record<string, string> = {
                          ad_click: t("admin.funnel.adClick", "Cliques no Site"),
                          sign_up: t("admin.funnel.signUp", "Cadastro"),
                          kit_created_1: t("admin.funnel.kit1", "Primeiro Kit"),
                          kit_created_3: t("admin.funnel.kit3", "Uso Inicial (3)"),
                          kit_created_5: t("admin.funnel.kit5", "Ativação (5)"),
                          kit_created_7: t("admin.funnel.kit7", "Pré-upgrade (7)"),
                          kit_created_10: t("admin.funnel.kit10", "Gatilho (10)"),
                          upgrade_pro: t("admin.funnel.upgradePro", "Conversão Paga"),
                        };
                        
                        const manualClicksPT = parseInt(funnelSiteClicksPT) || 0;
                        const processedFunnelDataPT = funnelDataPT.map(step => 
                          step.eventName === "ad_click" && manualClicksPT > 0 
                            ? { ...step, count: manualClicksPT }
                            : step
                        );
                        
                        const maxCount = Math.max(...processedFunnelDataPT.map(s => s.count), 1);
                        const firstNonZeroIdx = processedFunnelDataPT.findIndex(s => s.count > 0);
                        const baseCount = firstNonZeroIdx >= 0 ? processedFunnelDataPT[firstNonZeroIdx].count : 0;
                        
                        return processedFunnelDataPT.map((step, idx) => {
                          const prevCount = idx === 0 ? step.count : processedFunnelDataPT[idx - 1].count;
                          const dropoff = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100).toFixed(1) : "0";
                          const conversionFromBase = baseCount > 0 ? ((step.count / baseCount) * 100).toFixed(1) : "0";
                          const widthPercent = (step.count / maxCount) * 100;
                          
                          return (
                            <div key={step.eventName} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{funnelLabels[step.eventName] || step.eventName}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold">{step.count}</span>
                                  {idx > 0 && prevCount > 0 && step.count < prevCount && (
                                    <span className="text-xs text-destructive">-{dropoff}%</span>
                                  )}
                                  <span className="text-xs text-muted-foreground w-14 text-right">({conversionFromBase}%)</span>
                                </div>
                              </div>
                              <div className="h-4 bg-muted rounded-md overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${widthPercent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("admin.funnel.noData", "Ainda não há dados de funil.")}</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 3: Custos e Margem (Painel Híbrido) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Calculator className="w-5 h-5" />
                    {t("admin.costs.title", "Custos e Margem (Painel Híbrido)")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Configurações Manuais */}
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Settings className="w-4 h-4" />
                      {t("admin.costs.manualSettings", "Configurações Manuais")}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.costs.replitMonthlyCost", "Custo Mensal Replit (USD)")}</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={replitMonthlyCost} 
                          onChange={e => setReplitMonthlyCost(e.target.value)}
                          placeholder="138"
                          data-testid="input-replit-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.costs.iaPercentage", "% do Custo Atribuído à IA")}</Label>
                        <Input 
                          type="number" 
                          step="1"
                          value={iaPercentage} 
                          onChange={e => setIaPercentage(e.target.value)}
                          placeholder="0"
                          data-testid="input-ia-percentage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.costs.costPerIaAction", "Custo por Ação IA (R$)")}</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={costPerIaAction} 
                          onChange={e => setCostPerIaAction(e.target.value)}
                          placeholder="0.05"
                          data-testid="input-cost-per-ia"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("admin.costs.revenuePerPaidUser", "Receita por Usuário Pago (USD)")}</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={revenuePerPaidUser} 
                          onChange={e => setRevenuePerPaidUser(e.target.value)}
                          placeholder="1.79"
                          data-testid="input-revenue-per-user"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary"
                      onClick={() => {
                        toast({
                          title: t("admin.costs.saved", "Configurações salvas"),
                          description: t("admin.costs.savedDescription", "As configurações de custo foram salvas localmente."),
                        });
                      }}
                      data-testid="button-save-costs"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {t("admin.costs.saveSettings", "Salvar Configurações")}
                    </Button>
                  </div>

                  {/* Métricas Calculadas */}
                  {metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      {(() => {
                        const replitCost = parseFloat(replitMonthlyCost) || 0;
                        const iaPercent = parseFloat(iaPercentage) || 0;
                        const costIa = parseFloat(costPerIaAction) || 0;
                        const revPerUser = parseFloat(revenuePerPaidUser) || 0;
                        const paidUsers = metrics.paidUsersCount || 0;
                        const iaActions = metrics.iaActionsTotal || 0;
                        
                        const estimatedIaCost = iaActions * costIa;
                        const iaCostPerPaidUser = paidUsers > 0 ? estimatedIaCost / paidUsers : 0;
                        const totalRevenue = paidUsers * revPerUser;
                        const estimatedMargin = totalRevenue > 0 ? ((totalRevenue - iaCostPerPaidUser * paidUsers) / totalRevenue * 100) : 0;
                        const replitIaCost = replitCost * (iaPercent / 100);
                        
                        return (
                          <>
                            <div className="p-3 rounded-lg border text-center">
                              <Sparkles className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-xl font-bold">{iaActions}</div>
                              <div className="text-xs text-muted-foreground">{t("admin.costs.iaActionsMonth", "Ações IA/Mês")}</div>
                            </div>
                            <div className="p-3 rounded-lg border text-center">
                              <DollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-xl font-bold">R$ {estimatedIaCost.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{t("admin.costs.estimatedIaCost", "Custo IA Estimado")}</div>
                            </div>
                            <div className="p-3 rounded-lg border text-center">
                              <Calculator className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-xl font-bold">R$ {iaCostPerPaidUser.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{t("admin.costs.iaCostPerPaid", "Custo IA/Usuário Pago")}</div>
                            </div>
                            <div className="p-3 rounded-lg border text-center">
                              <CircleDollarSign className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-xl font-bold">$ {revPerUser.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{t("admin.costs.revenuePerPaid", "Receita/Usuário Pago")}</div>
                            </div>
                            <div className="p-3 rounded-lg border text-center">
                              <Percent className="w-4 h-4 mx-auto mb-1 text-green-500" />
                              <div className={`text-xl font-bold ${estimatedMargin >= 50 ? 'text-green-600' : estimatedMargin >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {estimatedMargin.toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">{t("admin.costs.estimatedMargin", "Margem Estimada")}</div>
                            </div>
                            <div className="p-3 rounded-lg border text-center">
                              <Bot className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-xl font-bold">$ {replitIaCost.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{t("admin.costs.replitIaCost", "Custo Replit IA")}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ======================== PRODUCT MODE ======================== */}
          {kpiMode === 'product' && (
            <>
              {/* BLOCO 1: Ativação e Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {t("admin.product.activationTitle", "Ativação e Engagement")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : metrics ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-users-1kit">
                          {metrics.usersWithAtLeastOneKit}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            ({metrics.totalUsers > 0 ? ((metrics.usersWithAtLeastOneKit / metrics.totalUsers) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.usersWith1Item", "Com 1+ itens")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-users-3items">
                          {funnelData?.find(s => s.eventName === "kit_created_3")?.count || 0}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            ({metrics.totalUsers > 0 ? (((funnelData?.find(s => s.eventName === "kit_created_3")?.count || 0) / metrics.totalUsers) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.usersWith3Items", "Com 3+ itens")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="product-activated">
                          {funnelData?.find(s => s.eventName === "kit_created_5")?.count || 0}
                          <span className="text-sm font-normal text-green-600 dark:text-green-400 ml-1">
                            ({metrics.totalUsers > 0 ? (((funnelData?.find(s => s.eventName === "kit_created_5")?.count || 0) / metrics.totalUsers) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">{t("admin.product.activated5Items", "Ativados (5+ itens)")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-users-10items">
                          {funnelData?.find(s => s.eventName === "kit_created_10")?.count || 0}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            ({metrics.totalUsers > 0 ? (((funnelData?.find(s => s.eventName === "kit_created_10")?.count || 0) / metrics.totalUsers) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.usersWith10Items", "Com 10+ itens")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-time-first-item">
                          {metrics.averageHoursToFirstKit}h
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.timeToFirstItem", "Tempo até 1º item")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-time-activation">
                          {metrics.avgDaysToTenItems}d
                        </div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.timeToActivation", "Tempo até ativação")}</div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`p-4 rounded-lg text-center border-2 ${
                            metrics.presenceD1Rate >= 30 ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' :
                            metrics.presenceD1Rate >= 25 ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' :
                            metrics.presenceD1Rate >= 15 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' :
                            'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              metrics.presenceD1Rate >= 30 ? 'text-green-700 dark:text-green-300' :
                              metrics.presenceD1Rate >= 25 ? 'text-blue-700 dark:text-blue-300' :
                              metrics.presenceD1Rate >= 15 ? 'text-yellow-700 dark:text-yellow-300' :
                              'text-red-700 dark:text-red-300'
                            }`} data-testid="product-presence-d1">
                              {metrics.presenceD1Rate}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.presenceD1", "Presença D+1")}</div>
                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                              {metrics.presenceD1UsersReturned}/{metrics.presenceD1UsersTotal}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-3">
                          <p className="text-sm font-semibold mb-2">{t("admin.product.presenceD1Tooltip", "Presença D+1 (Retenção Dia 1)")}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("admin.product.presenceD1What", "Mede quantos usuários voltaram ao app no dia seguinte ao cadastro para usar a Bancada.")}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("admin.product.presenceD1Why", "Indica o quão engajante é a primeira experiência. Alta retenção D+1 = usuários viram valor imediato no produto.")}
                          </p>
                          <div className="text-xs border-t pt-2 mt-2">
                            <p className="font-medium mb-1">{t("admin.product.benchmarks", "Benchmarks:")}</p>
                            <div className="space-y-0.5">
                              <p><span className="text-red-500">●</span> {"<15%: Precisa melhorar"}</p>
                              <p><span className="text-yellow-500">●</span> {"15-25%: Média"}</p>
                              <p><span className="text-blue-500">●</span> {"25-30%: Bom"}</p>
                              <p><span className="text-green-500">●</span> {"30%+: Excelente"}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`p-4 rounded-lg text-center border-2 ${
                            metrics.streakRitualRate >= 20 ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' :
                            metrics.streakRitualRate >= 15 ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' :
                            metrics.streakRitualRate >= 8 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' :
                            'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              metrics.streakRitualRate >= 20 ? 'text-green-700 dark:text-green-300' :
                              metrics.streakRitualRate >= 15 ? 'text-blue-700 dark:text-blue-300' :
                              metrics.streakRitualRate >= 8 ? 'text-yellow-700 dark:text-yellow-300' :
                              'text-red-700 dark:text-red-300'
                            }`} data-testid="product-streak-ritual">
                              {metrics.streakRitualRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.streakRitual", "Ritual ≥3d")}</div>
                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                              {metrics.streakRitualUsers}/{metrics.streakRitualActiveWeekUsers}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-3">
                          <p className="text-sm font-semibold mb-2">{t("admin.product.streakRitualTooltip", "Streak ≥3 dias (Ritual instalado)")}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("admin.product.streakRitualWhat", "Mede quantos usuários retornaram em 3+ dias diferentes dentro de uma janela de 7 dias.")}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("admin.product.streakRitualWhy", "Primeiro sinal real de hábito. Se essa métrica sobe: 1º item vem sozinho, 5 itens vira consequência, upgrade faz sentido.")}
                          </p>
                          <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                            <p>📌 {t("admin.product.streakRitualNote1", "Não precisa ser consecutivo")}</p>
                            <p>📌 {t("admin.product.streakRitualNote2", "Não precisa registrar nada")}</p>
                            <p>📌 {t("admin.product.streakRitualNote3", "Apenas \"estive aqui\"")}</p>
                          </div>
                          <div className="text-xs border-t pt-2 mt-2">
                            <p className="font-medium mb-1">{t("admin.product.benchmarks", "Benchmarks:")}</p>
                            <div className="space-y-0.5">
                              <p><span className="text-red-500">●</span> {"<8%: Precisa melhorar"}</p>
                              <p><span className="text-yellow-500">●</span> {"8-12%: MVP"}</p>
                              <p><span className="text-blue-500">●</span> {"15%: Bom"}</p>
                              <p><span className="text-green-500">●</span> {"20%+: Excelente"}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`p-4 rounded-lg text-center border-2 ${
                            metrics.spontaneousActionRate >= 25 ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' :
                            metrics.spontaneousActionRate >= 20 ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' :
                            metrics.spontaneousActionRate >= 10 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' :
                            'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              metrics.spontaneousActionRate >= 25 ? 'text-green-700 dark:text-green-300' :
                              metrics.spontaneousActionRate >= 20 ? 'text-blue-700 dark:text-blue-300' :
                              metrics.spontaneousActionRate >= 10 ? 'text-yellow-700 dark:text-yellow-300' :
                              'text-red-700 dark:text-red-300'
                            }`} data-testid="product-spontaneous-action">
                              {metrics.spontaneousActionRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.spontaneousAction", "Ação espontânea")}</div>
                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                              {metrics.spontaneousActionUsers}/{metrics.spontaneousActionTotalActive}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-3">
                          <p className="text-sm font-semibold mb-2">{t("admin.product.spontaneousActionTooltip", "Primeira ação espontânea (sem empurrão)")}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("admin.product.spontaneousActionWhat", "Usuários que cadastraram item sem modal, email ou CTA forçado nas últimas 24h.")}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t("admin.product.spontaneousActionWhy", "Indica autonomia, não obediência. Vale mais que ativação ≥5 porque mostra interesse genuíno.")}
                          </p>
                          <div className="text-xs border-t pt-2 mt-2">
                            <p className="font-medium mb-1">{t("admin.product.benchmarks", "Benchmarks:")}</p>
                            <div className="space-y-0.5">
                              <p><span className="text-red-500">●</span> {"<10%: Precisa melhorar"}</p>
                              <p><span className="text-yellow-500">●</span> {"10-15%: MVP"}</p>
                              <p><span className="text-blue-500">●</span> {"20%: Bom"}</p>
                              <p><span className="text-green-500">●</span> {"25%+: Forte"}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("admin.metrics.noData", "Sem dados")}</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 2: Uso do Produto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {t("admin.product.usageTitle", "Uso do Produto")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-avg-items">{metrics.averageItemsPerUser}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.avgItemsPerUser", "Média itens/usuário")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-total-items">{metrics.totalItems}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.totalItems", "Total de itens")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-no-items">{metrics.usersWithNoItems}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.usersNoItems", "Sem nenhum item")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-active-7d">{metrics.usersActive7Days}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.active7d", "Ativos 7d")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-active-30d">{metrics.usersActive30Days}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.active30d", "Ativos 30d")}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 3: Uso de IA (Colapsável) */}
              <Card>
                <CardHeader 
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setIaUsageCollapsed(!iaUsageCollapsed)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {t("admin.product.iaUsageTitle", "Uso de IA")}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {iaUsageCollapsed ? '+' : '-'}
                    </span>
                  </CardTitle>
                </CardHeader>
                {!iaUsageCollapsed && metrics && (
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-ia-users">{metrics.iaUsersCount}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.iaUsers", "Usuários com IA")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-ia-total">{metrics.iaActionsTotal}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.iaTotal", "Total ações IA")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-ia-avg">{metrics.iaActionsPerUserAverage}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.iaAvg", "Média ações/usuário")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground mb-2">{t("admin.product.iaDistribution", "Distribuição")}</div>
                        <div className="text-xs space-y-1">
                          <div>1 ação: {metrics.iaUsageDistribution.oneAction}</div>
                          <div>2-5: {metrics.iaUsageDistribution.twoToFiveActions}</div>
                          <div>6-20: {metrics.iaUsageDistribution.sixToTwentyActions}</div>
                          <div>20+: {metrics.iaUsageDistribution.moreThanTwentyActions}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* BLOCO 3.5: Welcome Modal Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="w-5 h-5" />
                    {t("admin.product.welcomeModalTitle", "Welcome Modal")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {welcomeModalStats ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold" data-testid="product-modal-shown">{welcomeModalStats.shown}</div>
                          <div className="text-xs text-muted-foreground">{t("admin.product.modalShown", "Modal exibido")}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-center">
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="product-modal-cta">{welcomeModalStats.ctaClicked}</div>
                          <div className="text-xs text-green-600 dark:text-green-400">{t("admin.product.modalCta", "CTA clicado")}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-center">
                          <div className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="product-modal-closed">{welcomeModalStats.closedWithoutAction}</div>
                          <div className="text-xs text-red-600 dark:text-red-400">{t("admin.product.modalClosed", "Fechado sem ação")}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <div className="text-2xl font-bold" data-testid="product-modal-rate">
                            {welcomeModalStats.shown > 0 ? ((welcomeModalStats.ctaClicked / welcomeModalStats.shown) * 100).toFixed(1) : 0}%
                          </div>
                          <div className="text-xs text-muted-foreground">{t("admin.product.modalConversion", "Taxa de conversão")}</div>
                        </div>
                      </div>
                      
                      {/* BR Breakdown */}
                      <div className="p-4 rounded-lg border bg-green-50/50 dark:bg-green-900/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300">BR</Badge>
                          <span>{t("admin.product.modalBreakdownBR", "Usuários BR")}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid="product-modal-shown-br">{welcomeModalStats.br?.shown || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalShown", "Modal exibido")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600" data-testid="product-modal-cta-br">{welcomeModalStats.br?.ctaClicked || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalCta", "CTA clicado")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600" data-testid="product-modal-closed-br">{welcomeModalStats.br?.closedWithoutAction || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalClosed", "Fechado sem ação")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid="product-modal-rate-br">
                              {(welcomeModalStats.br?.shown || 0) > 0 ? (((welcomeModalStats.br?.ctaClicked || 0) / welcomeModalStats.br.shown) * 100).toFixed(1) : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalConversion", "Taxa de conversão")}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* ES Breakdown */}
                      <div className="p-4 rounded-lg border bg-yellow-50/50 dark:bg-yellow-900/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300">ES</Badge>
                          <span>{t("admin.product.modalBreakdownES", "Usuários ES")}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid="product-modal-shown-es">{welcomeModalStats.es?.shown || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalShown", "Modal exibido")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600" data-testid="product-modal-cta-es">{welcomeModalStats.es?.ctaClicked || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalCta", "CTA clicado")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600" data-testid="product-modal-closed-es">{welcomeModalStats.es?.closedWithoutAction || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalClosed", "Fechado sem ação")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid="product-modal-rate-es">
                              {(welcomeModalStats.es?.shown || 0) > 0 ? (((welcomeModalStats.es?.ctaClicked || 0) / welcomeModalStats.es.shown) * 100).toFixed(1) : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalConversion", "Taxa de conversão")}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* PT Breakdown */}
                      <div className="p-4 rounded-lg border bg-red-50/50 dark:bg-red-900/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300">PT</Badge>
                          <span>{t("admin.product.modalBreakdownPT", "Usuários PT")}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid="product-modal-shown-pt">{welcomeModalStats.pt?.shown || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalShown", "Modal exibido")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600" data-testid="product-modal-cta-pt">{welcomeModalStats.pt?.ctaClicked || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalCta", "CTA clicado")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600" data-testid="product-modal-closed-pt">{welcomeModalStats.pt?.closedWithoutAction || 0}</div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalClosed", "Fechado sem ação")}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold" data-testid="product-modal-rate-pt">
                              {(welcomeModalStats.pt?.shown || 0) > 0 ? (((welcomeModalStats.pt?.ctaClicked || 0) / welcomeModalStats.pt.shown) * 100).toFixed(1) : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">{t("admin.product.modalConversion", "Taxa de conversão")}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t("admin.metrics.noData", "Sem dados")}</p>
                  )}
                </CardContent>
              </Card>

              {/* BLOCO 4: Conversão e Monetização */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {t("admin.product.conversionTitle", "Conversão e Monetização")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 text-center">
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300" data-testid="product-at-limit">{metrics.usersAtFreeLimit}</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">{t("admin.product.atLimit", "No limite (10 kits)")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-upgrade-clicks">{upgradeClicks?.count || 0}</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.upgradeClicks", "Cliques upgrade")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="product-paid">{metrics.paidUsersCount}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">{t("admin.product.paidUsers", "Conversões pagas")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-conversion-rate">{metrics.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.conversionRate", "Taxa Free → Pro")}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold" data-testid="product-time-upgrade">{metrics.avgDaysToTenItems}d</div>
                        <div className="text-xs text-muted-foreground">{t("admin.product.timeToUpgrade", "Tempo ativação → upgrade")}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          {/* Period Selector for Financeiro */}
          <div className="flex flex-wrap items-center justify-end gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Select value={funnelPeriod} onValueChange={(v) => setFunnelPeriod(v as 'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom')}>
                <SelectTrigger className="w-44" data-testid="select-financeiro-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t("admin.funnel.today", "Hoje")}</SelectItem>
                  <SelectItem value="yesterday">{t("admin.funnel.yesterday", "Ontem")}</SelectItem>
                  <SelectItem value="7d">{t("admin.funnel.last7Days", "Últimos 7 dias")}</SelectItem>
                  <SelectItem value="30d">{t("admin.funnel.last30Days", "Últimos 30 dias")}</SelectItem>
                  <SelectItem value="all">{t("admin.funnel.allTime", "Todo período")}</SelectItem>
                  <SelectItem value="custom">{t("admin.funnel.custom", "Personalizado")}</SelectItem>
                </SelectContent>
              </Select>
              {funnelPeriod === "custom" && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={funnelStartDate} 
                    onChange={e => setFunnelStartDate(e.target.value)}
                    className="w-36"
                    data-testid="input-financeiro-start"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input 
                    type="date" 
                    value={funnelEndDate} 
                    onChange={e => setFunnelEndDate(e.target.value)}
                    className="w-36"
                    data-testid="input-financeiro-end"
                  />
                </div>
              )}
            </div>
          </div>
          {(() => {
            // Financial calculations
            const exchangeRate = parseFloat(finExchangeRate) || 5.0;
            
            // Parse input values - if currency is BRL, convert to USD for internal calculations
            const toUSD = (value: number) => finCurrency === 'BRL' ? value / exchangeRate : value;
            
            const infraCostInput = parseFloat(finInfraCost) || 0;
            const adsCostInput = parseFloat(finAdsCost) || 0;
            const variableCostsInput = parseFloat(finVariableCosts) || 0;
            const cpcInput = parseFloat(finCPC) || 0;
            const simTicketInput = parseFloat(finSimTicket) || 0;
            
            // Convert to USD for internal calculations
            const infraCostUSD = toUSD(infraCostInput);
            const adsCostUSD = toUSD(adsCostInput);
            const variableCostsUSD = toUSD(variableCostsInput);
            const cpcUSD = toUSD(cpcInput);
            
            const ctr = parseFloat(finCTR) || 0;
            const conversionRateInput = parseFloat(finConversionRate) || 0;
            const conversionsAbsolute = parseFloat(finConversions) || 0;
            
            // Revenue inputs - editable ticket and paid users
            const ticketInput = parseFloat(finTicket) || 4.99;
            const ticketUSD = toUSD(ticketInput);
            const simTicketUSD = simTicketInput > 0 ? toUSD(simTicketInput) : ticketUSD;
            
            // Paid users - use input if provided, otherwise use real metrics
            const realPaidUsers = metrics?.paidUsersCount || 0;
            const paidUsersInput = finPaidUsers !== '' ? parseFloat(finPaidUsers) : null;
            const paidUsers = paidUsersInput !== null ? paidUsersInput : realPaidUsers;
            
            // OPEX
            const opexUSD = infraCostUSD + adsCostUSD + variableCostsUSD;
            
            // Current revenue
            const currentMRR_USD = paidUsers * ticketUSD;
            const arpu = ticketUSD;
            
            // Traffic & acquisition calculations
            const clicksFromAds = adsCostUSD > 0 && cpcUSD > 0 ? adsCostUSD / cpcUSD : 0;
            // Use absolute conversions if provided, otherwise calculate from rate
            const newPaidUsersFromAds = conversionsAbsolute > 0 
              ? conversionsAbsolute 
              : clicksFromAds * (conversionRateInput / 100);
            // Calculate effective conversion rate for display
            const effectiveConversionRate = clicksFromAds > 0 
              ? (newPaidUsersFromAds / clicksFromAds) * 100 
              : conversionRateInput;
            // CAC is infinite if spending on ads but getting no conversions
            const cacIsInfinite = adsCostUSD > 0 && newPaidUsersFromAds === 0;
            const cacUSD = newPaidUsersFromAds > 0 ? adsCostUSD / newPaidUsersFromAds : (cacIsInfinite ? Infinity : 0);
            
            // Revenue from ads
            const mrrFromAdsUSD = newPaidUsersFromAds * ticketUSD;
            const totalMRR_USD = currentMRR_USD + mrrFromAdsUSD;
            
            // Margin calculation
            const marginUSD = totalMRR_USD - opexUSD;
            const marginPercent = totalMRR_USD > 0 ? (marginUSD / totalMRR_USD) * 100 : 0;
            
            // Health indicators
            const breakevenMRR = opexUSD;
            const healthyMRR = opexUSD * 3;
            const comfortableMRR = opexUSD * 5;
            
            const usersForBreakeven = ticketUSD > 0 ? Math.ceil(breakevenMRR / ticketUSD) : 0;
            const usersForHealthy = ticketUSD > 0 ? Math.ceil(healthyMRR / ticketUSD) : 0;
            const usersForComfortable = ticketUSD > 0 ? Math.ceil(comfortableMRR / ticketUSD) : 0;
            
            // CAC health rules - infinite CAC or no ads = different states
            const cacRatio = ticketUSD > 0 && isFinite(cacUSD) ? cacUSD / ticketUSD : 0;
            const cacHealth = cacIsInfinite ? 'danger' : (adsCostUSD === 0 ? 'neutral' : (cacRatio > 3 ? 'danger' : cacRatio > 2 ? 'warning' : 'healthy'));
            
            // Margin health
            const marginHealth = marginPercent < 50 ? 'danger' : marginPercent < 70 ? 'warning' : 'healthy';
            
            // Net profit calculations (Lucro Líquido)
            const netProfitUSD = totalMRR_USD - opexUSD; // Same as marginUSD
            const netProfitPerUserUSD = paidUsers > 0 ? netProfitUSD / paidUsers : 0;
            // Net profit health: negative = danger, close to zero (< 5% of MRR) = warning, positive = healthy
            const netProfitHealth = netProfitUSD < 0 ? 'danger' : (totalMRR_USD > 0 && netProfitUSD / totalMRR_USD < 0.05) ? 'warning' : 'healthy';
            
            // Simulator calculations
            const simUsersForBreakeven = simTicketUSD > 0 ? Math.ceil(opexUSD / simTicketUSD) : 0;
            const simUsersForHealthy = simTicketUSD > 0 ? Math.ceil((opexUSD * 3) / simTicketUSD) : 0;
            const simUsersForComfortable = simTicketUSD > 0 ? Math.ceil((opexUSD * 5) / simTicketUSD) : 0;
            const simCACIsInfinite = adsCostUSD > 0 && newPaidUsersFromAds === 0;
            const simCAC_USD = newPaidUsersFromAds > 0 ? adsCostUSD / newPaidUsersFromAds : (simCACIsInfinite ? Infinity : 0);
            const simCACRatio = simTicketUSD > 0 && isFinite(simCAC_USD) ? simCAC_USD / simTicketUSD : 0;
            const simCACHealth = simCACIsInfinite ? 'danger' : (adsCostUSD === 0 ? 'neutral' : (simCACRatio > 3 ? 'danger' : simCACRatio > 2 ? 'warning' : 'healthy'));
            const simMRR = paidUsers * simTicketUSD;
            const simMargin = simMRR - opexUSD;
            const simMarginPercent = simMRR > 0 ? (simMargin / simMRR) * 100 : 0;
            const simMarginHealth = simMarginPercent < 50 ? 'danger' : simMarginPercent < 70 ? 'warning' : 'healthy';
            
            // Currency conversion helpers
            const formatCurrency = (valueUSD: number) => {
              if (finCurrency === 'BRL') {
                return `R$ ${(valueUSD * exchangeRate).toFixed(2)}`;
              }
              return `$ ${valueUSD.toFixed(2)}`;
            };
            
            const currencyLabel = finCurrency === 'BRL' ? 'BRL' : 'USD';
            const currencySymbol = finCurrency === 'BRL' ? 'R$' : '$';
            
            const healthIcon = (health: string) => {
              if (health === 'danger') return <XCircle className="w-4 h-4 text-red-500" />;
              if (health === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
              if (health === 'neutral') return <Info className="w-4 h-4 text-muted-foreground" />;
              return <CheckCircle className="w-4 h-4 text-green-500" />;
            };
            
            const healthBg = (health: string) => {
              if (health === 'danger') return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
              if (health === 'warning') return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
              if (health === 'neutral') return 'bg-muted/50 border-muted';
              return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
            };
            
            const formatCAC = (cac: number) => {
              if (!isFinite(cac)) return '∞';
              return formatCurrency(cac);
            };

            const saveFinancialSettings = () => {
              saveSettingsMutation.mutate({
                replitMonthlyCost,
                iaPercentage,
                costPerIaAction,
                revenuePerPaidUser,
                finExchangeRate,
                finInfraCost,
                finAdsCost,
                finVariableCosts,
                finCPC,
                finCTR,
                finConversionRate,
                finConversions,
                finSimTicket,
                finTicket,
                finPaidUsers,
                finCurrency,
              });
            };

            return (
              <>
                {/* Header with currency selector */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Painel Financeiro & Growth
                    </CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Moeda:</Label>
                        <Select value={finCurrency} onValueChange={(v) => setFinCurrency(v as 'USD' | 'BRL')}>
                          <SelectTrigger className="w-24" data-testid="select-fin-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="BRL">BRL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Câmbio USD→BRL:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={finExchangeRate}
                          onChange={(e) => setFinExchangeRate(e.target.value)}
                          className="w-20"
                          data-testid="input-exchange-rate"
                        />
                      </div>
                      <Button onClick={saveFinancialSettings} disabled={saveSettingsMutation.isPending} data-testid="button-save-financial">
                        {saveSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Salvar
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* OPEX Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CircleDollarSign className="w-5 h-5" />
                      Estrutura de Custos (OPEX Mensal)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Infraestrutura ({currencyLabel})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={finInfraCost}
                          onChange={(e) => setFinInfraCost(e.target.value)}
                          placeholder={finCurrency === 'BRL' ? '150.00' : '25.00'}
                          data-testid="input-infra-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Marketing / Ads ({currencyLabel})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={finAdsCost}
                          onChange={(e) => setFinAdsCost(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-ads-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Custos Variáveis ({currencyLabel})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={finVariableCosts}
                          onChange={(e) => setFinVariableCosts(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-variable-costs"
                        />
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground mb-1">OPEX Total</div>
                        <div className="text-2xl font-bold" data-testid="fin-opex-total">{formatCurrency(opexUSD)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="w-5 h-5" />
                      Receita Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Ticket Médio ({currencyLabel})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={finTicket}
                          onChange={(e) => setFinTicket(e.target.value)}
                          placeholder={finCurrency === 'BRL' ? '29.90' : '4.99'}
                          data-testid="input-ticket"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          Usuários Pagantes
                          <span className="text-muted-foreground">(BD: {realPaidUsers})</span>
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          value={finPaidUsers !== '' ? finPaidUsers : String(realPaidUsers)}
                          onChange={(e) => setFinPaidUsers(e.target.value)}
                          data-testid="input-paid-users"
                        />
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                        <div className="text-xs text-muted-foreground mb-1">MRR Atual</div>
                        <div className="text-2xl font-bold text-green-600" data-testid="fin-current-mrr">{formatCurrency(currentMRR_USD)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Inputs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MousePointer className="w-5 h-5" />
                      Simulação de Tráfego Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">CPC Médio ({currencyLabel})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={finCPC}
                          onChange={(e) => setFinCPC(e.target.value)}
                          placeholder={finCurrency === 'BRL' ? '3.00' : '0.50'}
                          data-testid="input-cpc"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          CTR (%)
                          <span className="text-muted-foreground">(informativo)</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={finCTR}
                          onChange={(e) => setFinCTR(e.target.value)}
                          placeholder="2"
                          data-testid="input-ctr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Taxa de Conversão (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={finConversionRate}
                          onChange={(e) => {
                            setFinConversionRate(e.target.value);
                            // Clear absolute conversions when rate is changed
                            if (e.target.value) setFinConversions("");
                          }}
                          placeholder="2"
                          disabled={finConversions !== ''}
                          data-testid="input-conversion-rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">OU Conversões Absolutas</Label>
                        <Input
                          type="number"
                          step="1"
                          value={finConversions}
                          onChange={(e) => setFinConversions(e.target.value)}
                          placeholder="Ex: 5"
                          data-testid="input-conversions-absolute"
                        />
                        <p className="text-xs text-muted-foreground">Preencha para ignorar a taxa</p>
                      </div>
                    </div>

                    {/* Calculated metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Cliques Estimados</div>
                        <div className="text-xl font-bold" data-testid="fin-clicks">{Math.round(clicksFromAds).toLocaleString()}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Conv. Efetiva</div>
                        <div className="text-xl font-bold" data-testid="fin-effective-rate">{effectiveConversionRate.toFixed(2)}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Novos Pagantes</div>
                        <div className="text-xl font-bold" data-testid="fin-new-paid">{Math.round(newPaidUsersFromAds)}</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center border ${healthBg(cacHealth)}`}>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                          CAC {healthIcon(cacHealth)}
                        </div>
                        <div className="text-xl font-bold" data-testid="fin-cac">{formatCAC(cacUSD)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground mb-1">MRR de Ads</div>
                        <div className="text-xl font-bold text-green-600" data-testid="fin-mrr-ads">{formatCurrency(mrrFromAdsUSD)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Health Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5" />
                      Indicadores de Saúde
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="text-xs text-muted-foreground mb-2">Breakeven (1x OPEX)</div>
                        <div className="text-xl font-bold">{formatCurrency(breakevenMRR)}</div>
                        <div className="text-sm text-muted-foreground">{usersForBreakeven} usuários</div>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                        <div className="text-xs text-muted-foreground mb-2">Saudável (3x OPEX)</div>
                        <div className="text-xl font-bold">{formatCurrency(healthyMRR)}</div>
                        <div className="text-sm text-muted-foreground">{usersForHealthy} usuários</div>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="text-xs text-muted-foreground mb-2">Confortável (5x OPEX)</div>
                        <div className="text-xl font-bold">{formatCurrency(comfortableMRR)}</div>
                        <div className="text-sm font-medium text-green-600">{usersForComfortable} usuários para ficar tranquilo</div>
                      </div>
                      <div className={`p-4 rounded-lg border ${healthBg(marginHealth)}`}>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          Margem Atual {healthIcon(marginHealth)}
                        </div>
                        <div className="text-xl font-bold">{marginPercent.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(marginUSD)}/mês</div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {(currentMRR_USD < opexUSD || cacHealth === 'danger') && (
                      <div className="mt-4 space-y-2">
                        {currentMRR_USD < opexUSD && (
                          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm">MRR abaixo do OPEX! O SaaS está operando no negativo.</span>
                          </div>
                        )}
                        {cacHealth === 'danger' && adsCostUSD > 0 && (
                          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm">CAC maior que 3x Ticket! Ads insustentáveis neste cenário.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Result - Lucro Líquido */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="w-5 h-5" />
                      Resultado Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className={`p-6 rounded-lg border-2 ${
                        netProfitHealth === 'danger' 
                          ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' 
                          : netProfitHealth === 'warning'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                            : 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {healthIcon(netProfitHealth)}
                          <span className="text-sm font-medium">Lucro Líquido Mensal</span>
                        </div>
                        <div className={`text-3xl font-bold ${
                          netProfitHealth === 'danger' 
                            ? 'text-red-600 dark:text-red-400' 
                            : netProfitHealth === 'warning'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                        }`} data-testid="fin-net-profit">
                          {netProfitUSD < 0 ? '-' : ''}{formatCurrency(Math.abs(netProfitUSD))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          MRR Total ({formatCurrency(totalMRR_USD)}) - OPEX ({formatCurrency(opexUSD)})
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Lucro por Usuário</span>
                        </div>
                        <div className={`text-2xl font-bold ${
                          netProfitPerUserUSD < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : netProfitPerUserUSD > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-muted-foreground'
                        }`} data-testid="fin-net-profit-per-user">
                          {netProfitPerUserUSD < 0 ? '-' : ''}{formatCurrency(Math.abs(netProfitPerUserUSD))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {paidUsers > 0 
                            ? `Cada usuário contribui ${netProfitPerUserUSD >= 0 ? '+' : '-'}${formatCurrency(Math.abs(netProfitPerUserUSD))} ao lucro`
                            : 'Nenhum usuário pagante'}
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Resumo</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">MRR Total:</span>
                            <span className="font-medium">{formatCurrency(totalMRR_USD)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">OPEX Total:</span>
                            <span className="font-medium">{formatCurrency(opexUSD)}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between gap-2">
                            <span className="font-medium">Sobra/Falta:</span>
                            <span className={`font-bold ${netProfitUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {netProfitUSD >= 0 ? '+' : ''}{formatCurrency(netProfitUSD)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Simulator */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="w-5 h-5" />
                      Simulador de Preço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Ticket Mensal Hipotético ({currencyLabel})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={finSimTicket}
                            onChange={(e) => setFinSimTicket(e.target.value)}
                            placeholder={finCurrency === 'BRL' ? '29.90' : '4.99'}
                            className="text-lg"
                            data-testid="input-sim-ticket"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          Altere o valor para simular impacto no negócio
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-xs text-muted-foreground mb-1">Breakeven</div>
                            <div className="text-lg font-bold">{simUsersForBreakeven} usuários</div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-xs text-muted-foreground mb-1">Saudável</div>
                            <div className="text-lg font-bold">{simUsersForHealthy} usuários</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                            <div className="text-xs text-muted-foreground mb-1">Confortável</div>
                            <div className="text-lg font-bold text-green-600">{simUsersForComfortable} usuários</div>
                          </div>
                          <div className={`p-3 rounded-lg text-center border ${healthBg(simCACHealth)}`}>
                            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                              CAC Aceitável {healthIcon(simCACHealth)}
                            </div>
                            <div className="text-lg font-bold">{formatCAC(simCAC_USD)}</div>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg text-center border ${healthBg(simMarginHealth)}`}>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                            Margem Simulada {healthIcon(simMarginHealth)}
                          </div>
                          <div className="text-lg font-bold">{simMarginPercent.toFixed(1)}% ({formatCurrency(simMargin)})</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Health Rules Legend */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">CAC:</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> ≤2x Ticket</span>
                        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> 2-3x Ticket</span>
                        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> &gt;3x Ticket</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Margem:</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> &gt;70%</span>
                        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> 50-70%</span>
                        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> &lt;50%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          {/* Period Selector for Admin */}
          <div className="flex flex-wrap items-center justify-end gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Select value={funnelPeriod} onValueChange={(v) => setFunnelPeriod(v as 'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom')}>
                <SelectTrigger className="w-44" data-testid="select-admin-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t("admin.funnel.today", "Hoje")}</SelectItem>
                  <SelectItem value="yesterday">{t("admin.funnel.yesterday", "Ontem")}</SelectItem>
                  <SelectItem value="7d">{t("admin.funnel.last7Days", "Últimos 7 dias")}</SelectItem>
                  <SelectItem value="30d">{t("admin.funnel.last30Days", "Últimos 30 dias")}</SelectItem>
                  <SelectItem value="all">{t("admin.funnel.allTime", "Todo período")}</SelectItem>
                  <SelectItem value="custom">{t("admin.funnel.custom", "Personalizado")}</SelectItem>
                </SelectContent>
              </Select>
              {funnelPeriod === "custom" && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={funnelStartDate} 
                    onChange={e => setFunnelStartDate(e.target.value)}
                    className="w-36"
                    data-testid="input-admin-start"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input 
                    type="date" 
                    value={funnelEndDate} 
                    onChange={e => setFunnelEndDate(e.target.value)}
                    className="w-36"
                    data-testid="input-admin-end"
                  />
                </div>
              )}
            </div>
          </div>
          {/* Users Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t("admin.users.title")} ({users.length})
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
                      {includedUsersCount} {t("admin.users.inMetrics", "nas métricas")}
                    </Badge>
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30">
                      {excludedUsersCount} {t("admin.users.outMetrics", "excluídos")}
                    </Badge>
                  </div>
                  <Select value={metricsFilter} onValueChange={(v) => setMetricsFilter(v as 'all' | 'included' | 'excluded')}>
                    <SelectTrigger className="w-[180px]" data-testid="select-metrics-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.users.filterAll", "Mostrar todos")}</SelectItem>
                      <SelectItem value="included">{t("admin.users.filterIncluded", "Nas métricas")}</SelectItem>
                      <SelectItem value="excluded">{t("admin.users.filterExcluded", "Excluídos das métricas")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">{t("admin.users.name")}</th>
                      <th className="text-left p-2 font-medium">{t("admin.users.email")}</th>
                      <th className="text-left p-2 font-medium">{t("admin.users.language", "Idioma")}</th>
                      <th className="text-left p-2 font-medium">{t("admin.users.country", "País")}</th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('createdAt')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-created-at"
                        >
                          {t("admin.users.registration")}
                          {sortColumn === 'createdAt' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('lastLogin')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-last-login"
                        >
                          {t("admin.users.lastLogin")}
                          {sortColumn === 'lastLogin' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('kitCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-kit-count"
                        >
                          {t("admin.users.kitsRegistered")}
                          {sortColumn === 'kitCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('kitsForSaleCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-kits-for-sale"
                        >
                          {t("admin.users.kitsForSale")}
                          {sortColumn === 'kitsForSaleCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('paintCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-paint-count"
                        >
                          Tintas
                          {sortColumn === 'paintCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('supplyCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-supply-count"
                        >
                          Insumos
                          {sortColumn === 'supplyCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('toolCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-tool-count"
                        >
                          Ferramentas
                          {sortColumn === 'toolCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('decalCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-decal-count"
                        >
                          Decais
                          {sortColumn === 'decalCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('totalItemsCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-total-items"
                        >
                          {t("admin.users.totalItems", "Total")}
                          {sortColumn === 'totalItemsCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-medium">
                        <button 
                          onClick={() => handleSort('upgradeClickCount')} 
                          className="flex items-center gap-1 hover-elevate rounded px-1"
                          data-testid="button-sort-upgrade-clicks"
                        >
                          Cliques Upgrade
                          {sortColumn === 'upgradeClickCount' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </th>
                      <th className="text-center p-2 font-medium">{t("admin.users.terms", "Termos")}</th>
                      <th className="text-center p-2 font-medium">{t("admin.users.excludeMetrics", "Excluir métricas")}</th>
                      <th className="text-center p-2 font-medium">{t("admin.users.status")}</th>
                      <th className="text-center p-2 font-medium">{t("admin.users.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(u => (
                      <tr key={u.id} className="border-b hover:bg-muted/30" data-testid={`row-user-${u.id}`}>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.profileImage || ""} />
                              <AvatarFallback className="text-xs">{u.name?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{u.name || t("admin.users.anonymous")}</span>
                            {u.isAdmin && (
                              <Badge className="text-xs bg-yellow-500 text-black">{t("nav.admin")}</Badge>
                            )}
                            {u.isPaused && (
                              <Badge variant="destructive" className="text-xs">{t("admin.users.paused")}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-muted-foreground">{u.email}</td>
                        <td className="p-2 text-muted-foreground">{u.registrationLanguage || "-"}</td>
                        <td className="p-2 text-muted-foreground">{u.country && u.country.trim() ? u.country : "-"}</td>
                        <td className="p-2 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="p-2 text-muted-foreground">{formatDate(u.lastLogin)}</td>
                        <td className="p-2 text-center font-medium">{u.kitCount}</td>
                        <td className="p-2 text-center font-medium">{u.kitsForSaleCount}</td>
                        <td className="p-2 text-center font-medium">{u.paintCount || 0}</td>
                        <td className="p-2 text-center font-medium">{u.supplyCount || 0}</td>
                        <td className="p-2 text-center font-medium">{u.toolCount || 0}</td>
                        <td className="p-2 text-center font-medium">{u.decalCount || 0}</td>
                        <td className="p-2 text-center font-medium">{u.totalItemsCount || 0}</td>
                        <td className="p-2 text-center font-medium">{u.upgradeClickCount || 0}</td>
                        <td className="p-2 text-center">
                          {u.acceptedTerms ? (
                            <Badge className="bg-green-600 text-white">{t("common.yes", "Sim")}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">{t("common.no", "Não")}</Badge>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Switch
                            checked={u.excludeFromMetrics || false}
                            onCheckedChange={(checked) => updateExcludeMetricsMutation.mutate({ userId: u.id, excludeFromMetrics: checked })}
                            data-testid={`switch-exclude-metrics-${u.id}`}
                            className={u.excludeFromMetrics ? "data-[state=checked]:bg-red-500" : ""}
                          />
                        </td>
                        <td className="p-2 text-center">{getStatusBadge(u.status)}</td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-1">
                            <Select 
                              value={u.status} 
                              onValueChange={(value) => updateStatusMutation.mutate({ userId: u.id, status: value })}
                            >
                              <SelectTrigger className="w-[100px] h-8 text-xs" data-testid={`select-status-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">{t("admin.status.free")}</SelectItem>
                                <SelectItem value="tester">{t("admin.status.tester")}</SelectItem>
                                <SelectItem value="pago">{t("admin.status.paid")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant={u.isPaused ? "destructive" : "ghost"}
                              onClick={() => updatePauseMutation.mutate({ userId: u.id, isPaused: !u.isPaused })}
                              title={u.isPaused ? t("admin.users.unpause") : t("admin.users.pause")}
                              data-testid={`button-toggle-pause-${u.id}`}
                            >
                              {u.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="icon"
                              variant={u.isAdmin ? "default" : "ghost"}
                              onClick={() => updateAdminMutation.mutate({ userId: u.id, isAdmin: !u.isAdmin })}
                              title={u.isAdmin ? t("admin.users.removeAdmin") : t("admin.users.promoteToAdmin")}
                              data-testid={`button-toggle-admin-${u.id}`}
                            >
                              <Shield className={`w-4 h-4 ${u.isAdmin ? "text-yellow-500" : ""}`} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openResetPassword(u)}
                              title={t("admin.resetPassword.title")}
                              data-testid={`button-reset-password-${u.id}`}
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => confirmDeleteUser(u)}
                              title={t("admin.users.delete")}
                              data-testid={`button-delete-${u.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t("admin.messages.title")} ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t("admin.messages.noMessages")}</p>
              ) : (
                <div className="space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className="p-3 border rounded-lg" data-testid={`message-${m.id}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium">{m.title}</span>
                        <div className="flex items-center gap-2">
                          {m.isGlobal ? (
                            <Badge variant="outline">{t("admin.messages.global")}</Badge>
                          ) : (
                            <Badge variant="secondary">{t("admin.messages.individual")}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => openEditMessage(m)}
                            title={t("admin.messages.edit")}
                            data-testid={`button-edit-message-${m.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => confirmDeleteMessage(m)}
                            title={t("common.delete")}
                            data-testid={`button-delete-message-${m.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.delete.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.delete.confirmUserMessage", { name: userToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.resetPassword.title")}</DialogTitle>
            <DialogDescription>
              {t("admin.resetPassword.description", { name: userToReset?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.resetPassword.newPassword")}</Label>
              <Input 
                type="password"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder={t("admin.resetPassword.minChars")}
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-confirm-reset-password"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {t("admin.resetPassword.resetButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editMessageOpen} onOpenChange={setEditMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.messages.editMessage")}</DialogTitle>
            <DialogDescription>
              {t("admin.messages.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.messages.messageTitle")}</Label>
              <Input 
                value={editMessageTitle} 
                onChange={e => setEditMessageTitle(e.target.value)} 
                placeholder={t("admin.messages.messageTitlePlaceholder")}
                data-testid="input-edit-message-title"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.messages.messageContent")}</Label>
              <Textarea 
                value={editMessageContent} 
                onChange={e => setEditMessageContent(e.target.value)} 
                placeholder={t("admin.messages.messageContentPlaceholder")}
                rows={4}
                data-testid="input-edit-message-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMessageOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleEditMessage}
              disabled={updateMessageMutation.isPending}
              data-testid="button-confirm-edit-message"
            >
              <Pencil className="w-4 h-4 mr-2" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteMessageOpen} onOpenChange={setDeleteMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.delete.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.delete.confirmMessageMessage", { title: messageToDelete?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMessageOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              variant="destructive" 
              onClick={() => messageToDelete && deleteMessageMutation.mutate(messageToDelete.id)}
              disabled={deleteMessageMutation.isPending}
              data-testid="button-confirm-delete-message"
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
