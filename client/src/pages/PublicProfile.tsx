import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Clock, DollarSign, Palette, Wrench, Star, Paintbrush, UserPlus } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import logoImg from "@assets/modelhero-logo6_1765850143132.png";
import StatusBadge from "@/components/StatusBadge";
import type { KitStatus } from "@/components/StatusBadge";
import { getRegisterPath, getModelHeroHomeUrl } from "@/lib/publicUtils";

const CHART_COLORS = ["#2d6a4f", "#c44536", "#5f9ea0", "#e9c46a", "#f4a261"];

interface PublicProfile {
  name: string;
  shareToken: string;
}

interface PublicKit {
  id: string;
  name: string;
  brand: string;
  scale: string;
  type: string;
  status: KitStatus;
  progress: number;
  hoursWorked: number;
  paidValue: number;
  currentValue: number;
  boxImage?: string | null;
  rating: number;
  notes?: string;
  paints?: any[];
  buildPhotos?: string[];
  referencePhotos?: any[];
  destino?: string;
  isForSale?: boolean;
  salePrice?: number;
}

interface PublicMaterial {
  id: string;
  name: string;
  type: string;
  brand?: string;
  paintCode?: string;
  paintColor?: string;
  paintHexColor?: string;
  currentQuantity: number;
  unit: string;
}

interface PublicStatistics {
  totalKits: number;
  totalHours: number;
  totalInvested: number;
  kitsByStatus: { status: string; count: number }[];
  kitsByScale: { scale: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  kitsByCategory: { category: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  na_caixa: "#6b7280",
  em_andamento: "#f59e0b",
  montado: "#22c55e",
  aguardando_reforma: "#ef4444",
  iniciado_parado: "#5f9ea0",
};

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ shareToken: string }>();
  const shareToken = params.shareToken;
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "kits";
  const [activeTab, setActiveTab] = useState(
    ["kits", "materials", "statistics"].includes(initialTab) ? initialTab : "kits"
  );

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<PublicProfile>({
    queryKey: ["/api/public", shareToken, "profile"],
    queryFn: async () => {
      const res = await fetch(`/api/public/${shareToken}/profile`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!shareToken,
  });

  const { data: kitsData, isLoading: kitsLoading } = useQuery<{ kits: PublicKit[] }>({
    queryKey: ["/api/public", shareToken, "kits"],
    queryFn: async () => {
      const res = await fetch(`/api/public/${shareToken}/kits`);
      if (!res.ok) throw new Error("Failed to fetch kits");
      return res.json();
    },
    enabled: !!shareToken,
  });

  const { data: materialsData, isLoading: materialsLoading } = useQuery<PublicMaterial[]>({
    queryKey: ["/api/public", shareToken, "materials"],
    queryFn: async () => {
      const res = await fetch(`/api/public/${shareToken}/materials`);
      if (!res.ok) throw new Error("Failed to fetch materials");
      return res.json();
    },
    enabled: !!shareToken && activeTab === "materials",
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<PublicStatistics>({
    queryKey: ["/api/public", shareToken, "statistics"],
    queryFn: async () => {
      const res = await fetch(`/api/public/${shareToken}/statistics`);
      if (!res.ok) throw new Error("Failed to fetch statistics");
      return res.json();
    },
    enabled: !!shareToken && activeTab === "statistics",
  });

  const kits = kitsData?.kits ?? [];
  const materials = materialsData ?? [];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-profile">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" data-testid="profile-not-found">
        <Package className="w-16 h-16 text-muted-foreground/50" />
        <p className="text-lg text-muted-foreground">
          {t("share.profileNotFound", { defaultValue: "Profile not found" })}
        </p>
      </div>
    );
  }

  const tintas = materials.filter((m) => m.type === "tintas");
  const insumos = materials.filter((m) => m.type === "insumos");
  const ferramentas = materials.filter((m) => m.type === "ferramentas");
  const decais = materials.filter((m) => m.type === "decais");

  const statusData = (statistics?.kitsByStatus ?? []).map((item) => ({
    name: t(`kits.status.${item.status}`, { defaultValue: item.status }),
    value: item.count,
    color: STATUS_COLORS[item.status] || "#6b7280",
  }));

  const scaleData = (statistics?.kitsByScale ?? [])
    .map((item) => ({ name: item.scale, kits: item.count }))
    .sort((a, b) => b.kits - a.kits);

  const brandsData = (statistics?.topBrands ?? [])
    .map((item) => ({ name: item.brand, kits: item.count }))
    .sort((a, b) => b.kits - a.kits);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-public-profile">
      <header className="sticky top-0 z-40" style={{ backgroundColor: "hsl(var(--sidebar))" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoImg} alt="ModelHero" className="h-8 w-auto" data-testid="img-public-logo" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }} data-testid="text-profile-name">
              {t("share.publicCollection", { defaultValue: "{{name}}'s Collection", name: profile.name })}
            </h1>
          </div>
          <a href={getRegisterPath(i18n.language)} data-testid="button-public-register">
            <Button size="sm" className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-white/20 border">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auth.createAccount", { defaultValue: "Create Account" })}</span>
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-public">
            <TabsTrigger value="kits" data-testid="tab-kits">
              {t("share.kits", { defaultValue: "Kits" })}
            </TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">
              {t("share.materials", { defaultValue: "Materials" })}
            </TabsTrigger>
            <TabsTrigger value="statistics" data-testid="tab-statistics">
              {t("share.statistics", { defaultValue: "Statistics" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kits" className="mt-6">
            {kitsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : kits.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="empty-kits">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t("share.noKitsFound", { defaultValue: "No kits found" })}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="kits-grid">
                {kits.map((kit) => (
                  <Link key={kit.id} href={`/share/${shareToken}/kit/${kit.id}`} className="block">
                    <Card className="hover-elevate overflow-visible cursor-pointer h-full" data-testid={`card-kit-${kit.id}`}>
                      <CardContent className="p-0">
                        {kit.boxImage ? (
                          <div className="w-full h-40 rounded-t-md overflow-hidden bg-muted">
                            <img
                              src={kit.boxImage}
                              alt={kit.name}
                              className="w-full h-full object-cover"
                              data-testid={`img-kit-box-${kit.id}`}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-40 rounded-t-md bg-muted/50 flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <h3 className="font-medium truncate" data-testid={`text-kit-name-${kit.id}`}>
                            {kit.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {kit.brand} | {kit.scale}
                          </p>
                          <div className="flex items-center flex-wrap gap-2">
                            <StatusBadge status={kit.status} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{t("share.progress", { defaultValue: "Progress" })}</span>
                              <span>{kit.progress}%</span>
                            </div>
                            <Progress value={kit.progress} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            {materialsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="empty-materials">
                <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t("share.noMaterialsFound", { defaultValue: "No materials found" })}</p>
              </div>
            ) : (
              <div className="space-y-6" data-testid="materials-list">
                <MaterialCategory
                  title={t("materials.tabs.paints", { defaultValue: "Tintas" })}
                  icon={<Paintbrush className="w-5 h-5" />}
                  items={tintas}
                />
                <MaterialCategory
                  title={t("materials.tabs.supplies", { defaultValue: "Insumos" })}
                  icon={<Package className="w-5 h-5" />}
                  items={insumos}
                />
                <MaterialCategory
                  title={t("materials.tabs.tools", { defaultValue: "Ferramentas" })}
                  icon={<Wrench className="w-5 h-5" />}
                  items={ferramentas}
                />
                <MaterialCategory
                  title={t("materials.tabs.decals", { defaultValue: "Decais" })}
                  icon={<Star className="w-5 h-5" />}
                  items={decais}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            {statsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : statistics ? (
              <div className="space-y-6" data-testid="statistics-section">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card data-testid="stat-total-kits">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-accent/10">
                          <Package className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {t("share.totalKits", { defaultValue: "Total Kits" })}
                          </p>
                          <p className="text-lg font-semibold tabular-nums">{statistics.totalKits}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="stat-total-hours">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-accent/10">
                          <Clock className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {t("share.totalHours", { defaultValue: "Total Hours" })}
                          </p>
                          <p className="text-lg font-semibold tabular-nums">
                            {Math.floor(statistics.totalHours)}h {Math.round((statistics.totalHours % 1) * 60)}min
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="stat-total-invested">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-accent/10">
                          <DollarSign className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {t("share.totalInvested", { defaultValue: "Total Invested" })}
                          </p>
                          <p className="text-lg font-semibold tabular-nums">
                            R$ {statistics.totalInvested.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t("share.kitsByStatus", { defaultValue: "Kits by Status" })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64" data-testid="chart-public-status">
                        {statusData.length > 0 ? (
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
                                label={({ value }) => `${value}`}
                                labelLine={false}
                              >
                                {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            {t("share.noKitsFound", { defaultValue: "No kits found" })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t("share.kitsByScale", { defaultValue: "Kits by Scale" })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64" data-testid="chart-public-scale">
                        {scaleData.length > 0 ? (
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
                              <Bar dataKey="kits" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]}>
                                {scaleData.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            {t("share.noKitsFound", { defaultValue: "No kits found" })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t("share.topBrands", { defaultValue: "Top Brands" })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64" data-testid="chart-public-brands">
                        {brandsData.length > 0 ? (
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
                              <Bar dataKey="kits" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]}>
                                {brandsData.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            {t("share.noKitsFound", { defaultValue: "No kits found" })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground" data-testid="footer-powered-by">
          Powered by{" "}
          <a
            href={getModelHeroHomeUrl(i18n.language)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
            data-testid="link-modelhero-home"
          >
            ModelHero
          </a>
        </div>
      </footer>
    </div>
  );
}

function MaterialCategory({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: PublicMaterial[];
}) {
  if (items.length === 0) return null;

  return (
    <Card data-testid={`material-category-${title.toLowerCase()}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50" data-testid={`material-item-${item.id}`}>
              {item.paintHexColor && (
                <div
                  className="w-6 h-6 rounded-md border flex-shrink-0"
                  style={{ backgroundColor: item.paintHexColor }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {[item.brand, item.paintCode, item.paintColor].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {item.currentQuantity} {item.unit}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
