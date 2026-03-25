import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  PlayCircle, 
  Timer,
  Box,
  Wrench,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Crown,
  Sparkles,
  Infinity,
  Download
} from "lucide-react";
import logoImage from "@assets/modelhero-logo7_1765889827932.png";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { getPaymentInfo } from "@/lib/paymentInfo";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import ShareButton from "@/components/ShareButton";

interface KitStatistics {
  kitsByStatus: { status: string; count: number }[];
  kitsByScale: { scale: string; count: number }[];
  kitsByCategory: { category: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  soldKitsCount: number;
  soldKitsValueByMonth: { month: string; value: number }[];
  totalSoldKitsValue: number;
  investmentByCategory: { category: string; investment: number }[];
  kitsForSaleCount: number;
  totalForSaleValue: number;
  forSaleVsSoldByMonth: { month: string; forSale: number; sold: number }[];
}

function formatHoursMinutes(totalHours: number): string {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

const STATUS_COLORS: Record<string, string> = {
  na_caixa: "#6b7280",
  em_andamento: "#f59e0b",
  montado: "#22c55e",
  aguardando_reforma: "#ef4444",
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "CNY" | "ARS" | "MXN" | "CLP";

interface EstatisticasProps {
  kits: Array<{
    status: string;
    type?: string;
    destino?: string;
    paidValue: number;
    paidValueCurrency?: string | null;
    currentValue?: number;
    salePrice?: number | null;
    isForSale?: boolean;
    soldDate?: string | null;
    hoursWorked: number;
    createdAt?: string | null;
  }>;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="p-2 rounded-md w-9 h-9" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-64 flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-destructive">
      {message}
    </div>
  );
}

const FREE_ITEM_LIMIT = 10;

export default function Estatisticas({ kits }: EstatisticasProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: statistics, isLoading, isError } = useQuery<KitStatistics>({
    queryKey: ['/api/statistics'],
  });
  const { data: usage } = useQuery<{ canAdd: boolean; totalItems: number; limit: number }>({
    queryKey: ['/api/item-limit'],
    enabled: user?.status === 'free',
  });
  const { formatCurrency, convert, getCurrencySymbol, preferredCurrency } = useCurrency();
  
  const isFreeUser = user?.status === 'free';
  const hasReachedLimit = (usage?.totalItems ?? 0) >= FREE_ITEM_LIMIT;
  const paymentInfo = getPaymentInfo(i18n.language);

  const trackUpgradeClick = () => {
    apiRequest("POST", "/api/user/upgrade-click").catch(() => {});
  };

  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  const formatMonth = (monthStr: string): string => {
    if (monthStr === "unknown") return t('statistics.unknown');
    const [year, month] = monthStr.split("-");
    const monthKey = monthKeys[parseInt(month) - 1];
    return `${t(`statistics.months.${monthKey}`)}/${year.slice(2)}`;
  };

  const getStatusLabel = (status: string): string => {
    return t(`statistics.status.${status}`, status);
  };

  const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["BRL", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "ARS", "MXN", "CLP"];

  const getKitCurrency = (k: { paidValueCurrency?: string | null }): SupportedCurrency => {
    const raw = k.paidValueCurrency || "BRL";
    return SUPPORTED_CURRENCIES.includes(raw as SupportedCurrency) ? (raw as SupportedCurrency) : "BRL";
  };

  const convertKitValue = (value: number, k: { paidValueCurrency?: string | null }): number => {
    return convert(value, getKitCurrency(k), preferredCurrency);
  };

  const soldKits = kits.filter((k) => k.destino === "vendido" || k.soldDate);
  const forSaleKits = kits.filter((k) => (k.isForSale || k.destino === "a_venda") && k.destino !== "vendido");

  const basicStats = {
    totalKits: kits.length,
    kitsCompleted: kits.filter((k) => k.status === "montado").length,
    kitsInProgress: kits.filter((k) => k.status === "em_andamento").length,
    kitsWaiting: kits.filter((k) => k.status === "na_caixa").length,
    kitsReform: kits.filter((k) => k.status === "aguardando_reforma").length,
    totalInvestment: kits.reduce((sum, k) => {
      return sum + convertKitValue(k.paidValue, k);
    }, 0),
    totalHours: kits.reduce((sum, k) => sum + k.hoursWorked, 0),
    hoursInProgress: kits
      .filter((k) => k.status === "em_andamento")
      .reduce((sum, k) => sum + k.hoursWorked, 0),
    soldKitsCount: soldKits.length,
    totalSoldKitsValue: soldKits.reduce((sum, k) => {
      const value = k.salePrice || k.paidValue || 0;
      return sum + convertKitValue(value, k);
    }, 0),
    kitsForSaleCount: forSaleKits.length,
    totalForSaleValue: forSaleKits.reduce((sum, k) => {
      const value = k.salePrice || 0;
      return sum + convertKitValue(value, k);
    }, 0),
  };

  const investmentByCategoryData = (() => {
    const categoryMap: Record<string, number> = {};
    for (const k of kits) {
      const category = k.type || "Outros";
      const convertedValue = convertKitValue(k.paidValue, k);
      categoryMap[category] = (categoryMap[category] || 0) + convertedValue;
    }
    return Object.entries(categoryMap)
      .map(([category, investment], index) => ({
        name: category,
        investimento: Math.round(investment * 100) / 100,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.investimento - a.investimento);
  })();

  const statusData = statistics?.kitsByStatus.map((item) => ({
    name: getStatusLabel(item.status),
    value: item.count,
    color: STATUS_COLORS[item.status] || "hsl(var(--muted))",
  })) || [];

  const scaleData = (statistics?.kitsByScale.map((item, index) => ({
    name: item.scale,
    kits: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || []).sort((a, b) => b.kits - a.kits);

  const categoryData = (statistics?.kitsByCategory.map((item, index) => ({
    name: item.category,
    kits: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || []).sort((a, b) => b.kits - a.kits);

  const brandsData = (statistics?.topBrands.map((item, index) => ({
    name: item.brand,
    kits: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || []).sort((a, b) => b.kits - a.kits);

  const investmentData = investmentByCategoryData;

  const salesByMonthData = (() => {
    const monthMap: Record<string, number> = {};
    for (const k of soldKits) {
      const monthKey = k.soldDate
        ? new Date(k.soldDate).toISOString().slice(0, 7)
        : "unknown";
      const value = k.salePrice || k.paidValue || 0;
      monthMap[monthKey] = (monthMap[monthKey] || 0) + convertKitValue(value, k);
    }
    return Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, valor]) => ({
      name: formatMonth(month),
      valor: Math.round(valor * 100) / 100,
    }));
  })();

  const statCards = [
    { title: t('statistics.totalKits'), value: basicStats.totalKits, icon: Package },
    { title: t('statistics.kitsCompleted'), value: basicStats.kitsCompleted, icon: CheckCircle },
    { title: t('statistics.inProgress'), value: basicStats.kitsInProgress, icon: PlayCircle, highlight: true },
    { title: t('statistics.inBox'), value: basicStats.kitsWaiting, icon: Box },
    { title: t('statistics.awaitingReform'), value: basicStats.kitsReform, icon: Wrench },
    { 
      title: t('statistics.totalInvestment'), 
      value: formatCurrency(basicStats.totalInvestment, preferredCurrency), 
      icon: DollarSign 
    },
    { title: t('statistics.totalHours'), value: formatHoursMinutes(basicStats.totalHours), icon: Clock },
    { 
      title: t('statistics.hoursInProgress'), 
      value: formatHoursMinutes(basicStats.hoursInProgress), 
      icon: Timer, 
      highlight: true 
    },
  ];

  const salesCards = [
    { 
      title: t('statistics.kitsForSale'), 
      value: basicStats.kitsForSaleCount, 
      icon: ShoppingCart 
    },
    { 
      title: t('statistics.forSaleValue'), 
      value: formatCurrency(basicStats.totalForSaleValue, preferredCurrency), 
      icon: DollarSign,
      highlight: true
    },
    { 
      title: t('statistics.kitsSold'), 
      value: basicStats.soldKitsCount, 
      icon: Package 
    },
    { 
      title: t('statistics.totalSoldValue'), 
      value: formatCurrency(basicStats.totalSoldKitsValue, preferredCurrency), 
      icon: TrendingUp,
      highlight: true
    },
  ];

  const forSaleVsSoldData = (() => {
    const soldByMonth: Record<string, number> = {};
    const forSaleByMonth: Record<string, number> = {};
    for (const k of soldKits) {
      const monthKey = k.soldDate
        ? new Date(k.soldDate).toISOString().slice(0, 7)
        : "unknown";
      const value = k.salePrice || k.paidValue || 0;
      soldByMonth[monthKey] = (soldByMonth[monthKey] || 0) + convertKitValue(value, k);
    }
    for (const k of forSaleKits) {
      const monthKey = k.createdAt
        ? new Date(k.createdAt).toISOString().slice(0, 7)
        : "unknown";
      const value = k.salePrice || 0;
      forSaleByMonth[monthKey] = (forSaleByMonth[monthKey] || 0) + convertKitValue(value, k);
    }
    const allMonths = new Set([...Object.keys(soldByMonth), ...Object.keys(forSaleByMonth)]);
    return Array.from(allMonths).sort().map((month) => ({
      name: formatMonth(month),
      forSale: Math.round((forSaleByMonth[month] || 0) * 100) / 100,
      sold: Math.round((soldByMonth[month] || 0) * 100) / 100,
    }));
  })();

  const tooltipStyle = { 
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px'
  };

  const handleRefresh = () => {
    queryClient.refetchQueries({ queryKey: ['/api/statistics'] });
    queryClient.refetchQueries({ queryKey: ['/api/kits'] });
  };

  return (
    <div className="relative min-h-full p-4 md:p-6 space-y-6 pb-20 md:pb-6" data-testid="page-estatisticas">
      {isFreeUser && (
        <div className="absolute inset-0 z-40 flex items-start justify-center pt-8 md:pt-16 bg-background/80 backdrop-blur-sm overflow-y-auto" data-testid="premium-overlay">
          <Card className="max-w-md mx-4 mb-8">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center">
                  <img 
                    src={logoImage} 
                    alt="ModelHero" 
                    className="h-16 w-auto"
                    data-testid="img-statistics-upgrade-logo"
                  />
                </div>
                <h2 className="text-xl font-semibold" data-testid="text-statistics-upgrade-title">
                  {t('statistics.premium.title')}
                </h2>
                <p className="text-base text-muted-foreground" data-testid="text-statistics-upgrade-description">
                  {t('statistics.premium.message')}
                </p>
              </div>

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

              {hasReachedLimit && (
                <>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-secondary" data-testid="text-statistics-promo-label">
                      {t(paymentInfo.labelKey)}
                    </p>
                    <p className="text-2xl font-bold text-secondary" data-testid="text-statistics-upgrade-price">
                      {paymentInfo.originalPrice && (
                        <span className="text-base line-through text-muted-foreground mr-2">
                          {paymentInfo.currency}{paymentInfo.originalPrice}
                        </span>
                      )}
                      {paymentInfo.currency}{paymentInfo.promoPrice}
                      <span className="text-sm font-normal text-muted-foreground">{t("upgrade.perMonth")}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-secondary hover:bg-secondary/90 text-white"
                      asChild
                      data-testid="button-unlock-premium"
                    >
                      <a href={paymentInfo.link} target="_blank" rel="noopener noreferrer" onClick={trackUpgradeClick}>
                        <Crown className="w-4 h-4 mr-2" />
                        {t("upgrade.doUpgrade")}
                      </a>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('statistics.title')}</h1>
          <p className="text-muted-foreground">{t('statistics.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <ShareButton page="statistics" />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="button-refresh-stats"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${stat.highlight ? 'bg-secondary/10' : 'bg-accent/10'}`}>
                  <stat.icon className={`w-5 h-5 ${stat.highlight ? 'text-secondary' : 'text-accent'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                  <p className={`text-lg font-semibold tabular-nums ${stat.highlight ? 'text-secondary' : ''}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          salesCards.map((stat) => (
            <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${stat.highlight ? 'bg-secondary/10' : 'bg-accent/10'}`}>
                    <stat.icon className={`w-5 h-5 ${stat.highlight ? 'text-secondary' : 'text-accent'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                    <p className={`text-lg font-semibold tabular-nums ${stat.highlight ? 'text-secondary' : ''}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.kitsByStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-status">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noKitsRegistered')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.kitsByScale')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-scale">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : scaleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scaleData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar 
                      dataKey="kits" 
                      name={t('statistics.kits')} 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList dataKey="kits" position="right" style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noKitsRegistered')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.kitsByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-category">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar 
                      dataKey="kits" 
                      name={t('statistics.kits')} 
                      fill="hsl(var(--accent))" 
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList dataKey="kits" position="top" style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noKitsRegistered')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.topBrands')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-brands">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : brandsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandsData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false}
                      width={80}
                      interval={0}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar 
                      dataKey="kits" 
                      name={t('statistics.kits')} 
                      fill="hsl(var(--secondary))" 
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList dataKey="kits" position="right" style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noKitsRegistered')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.investmentByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-investment">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : investmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={investmentData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}`}
                    />
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [formatCurrency(value, preferredCurrency), t('statistics.investment')]}
                    />
                    <Bar 
                      dataKey="investimento" 
                      name={t('statistics.investment')} 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList dataKey="investimento" position="top" style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} formatter={(value: number) => `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noInvestmentRegistered')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.salesByMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-sales-month">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : salesByMonthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesByMonthData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}`}
                    />
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [formatCurrency(value, preferredCurrency), t('statistics.value')]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      name={t('statistics.value')} 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2 }}
                    >
                      <LabelList dataKey="valor" position="top" style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} formatter={(value: number) => `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}`} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noSalesRegistered')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t('statistics.forSaleVsSold')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-forsale-vs-sold">
              {isLoading ? (
                <ChartSkeleton />
              ) : isError ? (
                <ChartError message={t('statistics.errorLoadingData')} />
              ) : forSaleVsSoldData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forSaleVsSoldData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}`}
                    />
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value, preferredCurrency), 
                        name === "forSale" ? t('statistics.forSaleAccumulated') : t('statistics.sold')
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === "forSale" ? t('statistics.forSaleAccumulated') : t('statistics.sold')}
                    />
                    <Bar 
                      dataKey="forSale" 
                      name="forSale" 
                      fill="hsl(var(--accent))" 
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList dataKey="forSale" position="top" style={{ fontSize: 9, fill: 'hsl(var(--foreground))' }} formatter={(value: number) => value > 0 ? `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}` : ''} />
                    </Bar>
                    <Bar 
                      dataKey="sold" 
                      name="sold" 
                      fill="hsl(var(--secondary))" 
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList dataKey="sold" position="top" style={{ fontSize: 9, fill: 'hsl(var(--foreground))' }} formatter={(value: number) => value > 0 ? `${getCurrencySymbol(preferredCurrency)}${Math.round(value)}` : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('statistics.noSalesData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
