import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useTranslation } from "react-i18next";

const KIT_TYPE_KEYS: Record<string, string> = {
  "Avião": "airplane", "Helicóptero": "helicopter", "Militaria": "military",
  "Veículo": "vehicle", "Navio": "ship", "Submarino": "submarine",
  "Figura": "figure", "Diorama": "diorama", "Sci-Fi": "scifi", "Outro": "other",
};
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Package,
  CheckCircle,
  Clock,
  DollarSign,
  PlayCircle,
  Timer,
  Camera,
  Loader2,
  CheckCircle2,
  Upload,
  PauseCircle,
  ImageIcon,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useCurrency, type CurrencyCode } from "@/contexts/CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatCard from "@/components/StatCard";
import KitCard from "@/components/KitCard";
import KitForm from "@/components/KitForm";
import UpgradeModal from "@/components/UpgradeModal";
import WelcomeModal from "@/components/WelcomeModal";
import { FirstKitRegisteredModal } from "@/components/FirstKitRegisteredModal";
import FavoriteLinksSection from "@/components/FavoriteLinksSection";

import ScaleConverter from "@/components/ScaleConverter";
import PaintConverter from "@/components/PaintConverter";
import DuplicateChecker from "@/components/DuplicateChecker";
import { TodaySession } from "@/components/TodaySession";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Kit } from "@/components/KitCard";

interface UsageData {
  kitsCount: number;
  materialsCount: number;
  wishlistCount: number;
  totalCount: number;
  limit: number;
  hasUnlimitedAccess: boolean;
  canAddItem: boolean;
  canExport: boolean;
}

interface RecentGlobalKit {
  id: string;
  name: string;
  brand: string;
  scale: string;
  boxImage: string;
}

interface GlobalStats {
  topBrands: { brand: string; count: number }[];
  topKits: { name: string; brand: string; scale: string; count: number }[];
  topScales: { scale: string; count: number }[];
}

function formatHoursMinutes(totalHours: number): string {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

interface HomeProps {
  kits: Kit[];
  onAddKit: (kit: Omit<Kit, "id">) => void;
  onEditKit: (kit: Kit) => void;
  isSavingKit?: boolean;
}

export default function Home({
  kits,
  onAddKit,
  onEditKit,
  isSavingKit,
}: HomeProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { convert, formatCurrency, preferredCurrency } = useCurrency();
  const [formOpen, setFormOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<
    "na_caixa" | "em_andamento"
  >("na_caixa");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [welcomeModalDismissed, setWelcomeModalDismissed] = useState(() => {
    return sessionStorage.getItem("welcomeModalShownThisSession") === "true";
  });
  const [firstKitModalOpen, setFirstKitModalOpen] = useState(false);
  const [firstKitId, setFirstKitId] = useState<string | null>(null);

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  const { data: recentGlobalKitsData, isLoading: isLoadingRecentKits } =
    useQuery<{ kits: RecentGlobalKit[] }>({
      queryKey: ["/api/kits/recent-global"],
    });

  const { data: globalStats } = useQuery<GlobalStats>({
    queryKey: ["/api/kits/global-stats"],
  });

  const [boxScanDialogOpen, setBoxScanDialogOpen] = useState(false);
  const [boxScanLoading, setBoxScanLoading] = useState(false);
  const [boxPhotoPreview, setBoxPhotoPreview] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());
  const [boxScanResults, setBoxScanResults] = useState<{
    kits: { name: string; brand: string; scale: string; type: string }[];
    notes: string;
    createdKits: Kit[];
  } | null>(null);
  const boxPhotoCameraRef = useRef<HTMLInputElement>(null);
  const boxPhotoGalleryRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const firstName = user?.name?.split(" ")[0] || "Plastimodelista";

  const getKitUpdatedTs = (k: any): number => {
    const raw =
      k?.updatedAt ??
      k?.lastUpdatedAt ??
      k?.lastActivityAt ??
      k?.modifiedAt ??
      k?.editedAt ??
      k?.lastEditAt ??
      k?.createdAt ??
      k?.dateCreated ??
      k?.created_at ??
      k?.updated_at ??
      null;

    if (!raw) return 0;

    if (typeof raw === "number") return raw;

    const t = Date.parse(String(raw));
    return Number.isFinite(t) ? t : 0;
  };

  const sortByMostUpdated = (a: any, b: any) =>
    getKitUpdatedTs(b) - getKitUpdatedTs(a);

  // Defensive filtering with error handling + ordering by most recently updated
  const inProgressKits = (kits || [])
    .filter((k) => k && ["em_andamento", "em andamento"].includes(k.status))
    .sort(sortByMostUpdated);

  const pausedKits = (kits || [])
    .filter((k) => k && ["iniciado_parado", "pausado"].includes(k.status))
    .sort(sortByMostUpdated);

  const stats = {
    totalKits: kits.length,
    kitsCompleted: kits.filter((k) =>
      ["montado", "finalizado"].includes(k.status),
    ).length,
    kitsInProgress: inProgressKits.length,
    totalInvestment: kits.reduce((sum, k) => {
      const currency = (k.paidValueCurrency as CurrencyCode) || "BRL";
      return sum + convert(k.paidValue, currency, preferredCurrency);
    }, 0),
    totalHours: kits.reduce((sum, k) => sum + k.hoursWorked, 0),
    hoursInProgress: inProgressKits.reduce((sum, k) => sum + k.hoursWorked, 0),
  };

  const displayKits = inProgressKits.slice(0, 3);
  const displayPausedKits = pausedKits.slice(0, 6);

  useEffect(() => {
    if (kits.length === 0 && !welcomeModalDismissed) {
      setWelcomeModalOpen(true);
    }
  }, [kits.length, welcomeModalDismissed]);

  useEffect(() => {
    const storedPrev = sessionStorage.getItem("previousKitsCount");
    const prev = storedPrev !== null ? parseInt(storedPrev, 10) : null;

    if (prev !== null && prev !== kits.length) {
      if (prev === 0 && kits.length === 1) {
        setFirstKitId(kits[0].id);
        setFirstKitModalOpen(true);
      }
    }
    sessionStorage.setItem("previousKitsCount", kits.length.toString());
  }, [kits.length]);

  const handleWelcomeModalClose = (open: boolean) => {
    setWelcomeModalOpen(open);
    if (!open) {
      setWelcomeModalDismissed(true);
      sessionStorage.setItem("welcomeModalShownThisSession", "true");
    }
  };

  const handleOpenForm = (status?: "na_caixa" | "em_andamento") => {
    if (usage && !usage.canAddItem) {
      setUpgradeModalOpen(true);
      return;
    }
    setDefaultStatus(status || "na_caixa");
    setFormOpen(true);
  };

  const handleOpenFormInProgress = () => {
    handleOpenForm("em_andamento");
  };

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("openForm") === "true") {
      setLocation("/", { replace: true });
      setTimeout(() => handleOpenForm(), 150);
    }
  }, [searchString]);

  const handleSave = (kit: Omit<Kit, "id"> & { id?: string }) => {
    if (kit.id) {
      onEditKit(kit as Kit);
    } else {
      onAddKit(kit);
    }
    setEditingKit(null);
  };

  const handleBoxPhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Raw = reader.result as string;
      const { rotateToLandscape } = await import("@/lib/imageUtils");
      const base64 = await rotateToLandscape(base64Raw);
      setBoxPhotoPreview(base64);
      setBoxScanDialogOpen(true);
      setBoxScanLoading(true);
      setBoxScanResults(null);

      try {
        const response = await fetch("/api/ai/extract-kit-from-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: base64 }),
        });

        if (response.ok) {
          const data = await response.json();
          setBoxScanResults(data);

          if (data.createdKits && data.createdKits.length > 0) {
            queryClient.refetchQueries({ queryKey: ["/api/kits"] });
            queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
            toast({
              title: t("home.boxScan.successToast"),
              description: t("home.boxScan.successDescription", {
                count: data.createdKits.length,
              }),
            });
          }
        } else {
          toast({
            title: t("common.error"),
            description: t("home.boxScan.errorAnalyzing"),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Box scan error:", error);
        toast({
          title: t("common.error"),
          description: t("home.boxScan.errorProcessing"),
          variant: "destructive",
        });
      } finally {
        setBoxScanLoading(false);
      }
    };
    reader.readAsDataURL(file);

    if (boxPhotoCameraRef.current) {
      boxPhotoCameraRef.current.value = "";
    }
    if (boxPhotoGalleryRef.current) {
      boxPhotoGalleryRef.current.value = "";
    }
  };

  const handleCloseBoxScanDialog = () => {
    setBoxScanDialogOpen(false);
    setBoxPhotoPreview(null);
    setBoxScanResults(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6" data-testid="page-home">
      {/* Empty state - only show alert when no kits */}
      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card
            className="border-2 border-secondary bg-secondary/5 max-w-lg w-full"
            data-testid="alert-empty-collection"
          >
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
                <Package className="w-10 h-10 text-secondary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-secondary">
                  {t("home.emptyState.title", "Seu ModelHero está vazio.")}
                </h2>
                <p className="text-muted-foreground">
                  {t(
                    "home.emptyState.subtitle",
                    "Cadastre seu primeiro kit para começar a organizar sua coleção.",
                  )}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground">
                  {t(
                    "home.emptyState.benefit",
                    "Modelistas que cadastram ao menos 1 kit tiram muito mais proveito do ModelHero",
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "home.emptyState.tip",
                    "Comece com o kit que você tem mais fácil à mão",
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("home.emptyState.tipEdit", "Você pode editar tudo depois")}
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white w-full"
                  onClick={() => handleOpenForm()}
                  data-testid="button-first-kit-cta"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t("home.emptyState.button", "Cadastrar meu primeiro kit")}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "home.emptyState.note",
                    "Leva menos de 1 minuto • Você pode editar depois",
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Normal content - only shown when user has kits */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold">
                {t("home.welcome", { name: firstName })}
              </h1>
              <p className="text-muted-foreground">{t("home.subtitle")}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleOpenForm()}
              data-testid="button-new-kit-home"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("home.newKit")}
            </Button>
          </div>

          <TodaySession />

          {stats.totalKits >= 10 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                title={t("home.totalKits")}
                value={stats.totalKits}
                icon={Package}
              />
              <StatCard
                title={t("home.kitsCompleted")}
                value={stats.kitsCompleted}
                icon={CheckCircle}
              />
              <StatCard
                title={t("home.inProgressKits")}
                value={stats.kitsInProgress}
                icon={PlayCircle}
                highlight
              />
              <StatCard
                title={t("home.investment")}
                value={formatCurrency(stats.totalInvestment, preferredCurrency)}
                icon={DollarSign}
              />
              <StatCard
                title={t("home.totalHours")}
                value={formatHoursMinutes(stats.totalHours)}
                icon={Clock}
              />
              <StatCard
                title={t("home.hoursInProgress")}
                value={formatHoursMinutes(stats.hoursInProgress)}
                icon={Timer}
                highlight
              />
            </div>
          )}

          {stats.totalKits > 0 && stats.totalKits < 5 && (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                <div>
                  <h3 className="font-medium">
                    {t("home.encouragement.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("home.encouragement.text")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href="/kits"
                      data-testid="link-encouragement-view-kits"
                    >
                      {t("home.encouragement.secondary")}
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenForm()}
                    data-testid="button-encouragement-register"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    {t("home.encouragement.cta")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.totalKits < 2 && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4">
                <h3 className="font-medium mb-2">
                  {t("home.whyContinue.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("home.whyContinue.text")}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                    {t("home.whyContinue.noCommitment")}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                    {t("home.whyContinue.editLater")}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                    {t("home.whyContinue.lessThanMinute")}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-medium">
                {t("home.kitsInProgress")}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/em-andamento" data-testid="link-view-all-progress">
                  {t("home.viewAll")}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayKits.map((kit) => (
                <KitCard
                  key={kit.id}
                  kit={kit}
                  onEdit={(k) => {
                    setEditingKit(k);
                    setFormOpen(true);
                  }}
                />
              ))}
              {displayKits.length < 3 && (
                <>
                  {displayKits.length < 1 && (
                    <Card
                      className="border-dashed bg-muted/30"
                      data-testid="placeholder-first-progress"
                    >
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <PlayCircle className="w-10 h-10 mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mb-3">
                          {t("home.inProgressPlaceholder.first")}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleOpenFormInProgress}
                          data-testid="button-placeholder-first-progress"
                        >
                          {t("home.inProgressPlaceholder.cta")}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  {displayKits.length < 2 && (
                    <Card
                      className="border-dashed bg-muted/30"
                      data-testid="placeholder-second-progress"
                    >
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <PlayCircle className="w-10 h-10 mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mb-3">
                          {t("home.inProgressPlaceholder.second")}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleOpenFormInProgress}
                          data-testid="button-placeholder-second-progress"
                        >
                          {t("home.inProgressPlaceholder.cta")}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  {displayKits.length < 3 && (
                    <Card
                      className="border-dashed bg-muted/30"
                      data-testid="placeholder-third-progress"
                    >
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <PlayCircle className="w-10 h-10 mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mb-3">
                          {t("home.inProgressPlaceholder.third")}
                        </p>
                        <Button
                          size="sm"
                          onClick={handleOpenFormInProgress}
                          data-testid="button-placeholder-third-progress"
                        >
                          {t("home.inProgressPlaceholder.cta")}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>

          {displayPausedKits.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-medium">{t("home.kitsPaused")}</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/kits" data-testid="link-view-all-paused">
                    {t("home.viewAll")}
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {displayPausedKits.map((kit) => (
                  <KitCard
                    key={kit.id}
                    kit={kit}
                    compact
                    onEdit={(k) => {
                      setEditingKit(k);
                      setFormOpen(true);
                    }}
                  />
                ))}
                {pausedKits.length < 6 && (
                  <Card
                    className="border-dashed bg-muted/30"
                    data-testid="placeholder-paused-kit"
                  >
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center h-full">
                      <PauseCircle className="w-8 h-8 mb-2 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("home.pausedPlaceholder.cta")}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenForm()}
                        data-testid="button-placeholder-paused"
                      >
                        {t("home.pausedPlaceholder.registerCta")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {recentGlobalKitsData?.kits &&
            recentGlobalKitsData.kits.filter(
              (kit) => !brokenImageIds.has(kit.id),
            ).length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4">
                  {t("home.recentGlobalKits.title")}
                </h2>
                {isLoadingRecentKits ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                    <p>{t("home.recentGlobalKits.loading")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {recentGlobalKitsData.kits
                      .filter((kit) => !brokenImageIds.has(kit.id))
                      .map((kit) => (
                        <Card
                          key={kit.id}
                          className="overflow-hidden"
                          data-testid={`recent-global-kit-${kit.id}`}
                        >
                          <div className="aspect-square relative">
                            <img
                              src={kit.boxImage}
                              alt={kit.name}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setBrokenImageIds((prev) =>
                                  new Set(prev).add(kit.id),
                                );
                              }}
                            />
                          </div>
                          <CardContent className="p-2">
                            <p
                              className="text-sm font-medium line-clamp-1"
                              title={kit.name}
                            >
                              {kit.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {kit.brand} • {kit.scale}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            )}

          {globalStats &&
            (globalStats.topBrands.length > 0 ||
              globalStats.topKits.length > 0 ||
              globalStats.topScales.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {globalStats.topBrands.length > 0 && (
                  <Card data-testid="card-top-brands">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3">
                        {t("home.globalStats.topBrands")}
                      </h3>
                      <ul className="space-y-2">
                        {globalStats.topBrands.map((item, index) => (
                          <li
                            key={item.brand}
                            className="flex items-center text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {index + 1}.
                              </span>
                              <span>{item.brand}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {globalStats.topKits.length > 0 && (
                  <Card data-testid="card-top-kits">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3">
                        {t("home.globalStats.topKits")}
                      </h3>
                      <ul className="space-y-2">
                        {globalStats.topKits.map((item, index) => (
                          <li
                            key={`${item.name}-${item.brand}-${item.scale}`}
                            className="text-sm"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground">
                                {index + 1}.
                              </span>
                              <span className="line-clamp-1">{item.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-5">
                              {item.brand} • {item.scale}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {globalStats.topScales.length > 0 && (
                  <Card data-testid="card-top-scales">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3">
                        {t("home.globalStats.topScales")}
                      </h3>
                      <ul className="space-y-2">
                        {globalStats.topScales.map((item, index) => (
                          <li
                            key={item.scale}
                            className="flex items-center text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {index + 1}.
                              </span>
                              <span>{item.scale}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

          <div>
            <h2 className="text-lg font-medium mb-4">
              {t("home.advancedTools.title")}
            </h2>
            <div className="space-y-3">
              <DuplicateChecker defaultCollapsed />
              <ScaleConverter defaultCollapsed />
              <PaintConverter defaultCollapsed />
            </div>
          </div>

          {user?.status !== "free" && (
            <>
              <FavoriteLinksSection />
            </>
          )}
        </>
      )}

      <KitForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kit={editingKit}
        onSave={handleSave}
        isSaving={isSavingKit}
        defaultStatus={defaultStatus}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />

      <WelcomeModal
        open={welcomeModalOpen}
        onOpenChange={handleWelcomeModalClose}
        onRegisterManually={handleOpenForm}
      />

      <FirstKitRegisteredModal
        open={firstKitModalOpen}
        onOpenChange={setFirstKitModalOpen}
        onRegisterAnother={handleOpenForm}
        onViewKitDetails={() => {
          if (firstKitId) {
            setLocation(`/kit/${firstKitId}`);
          }
        }}
      />

      <Dialog open={boxScanDialogOpen} onOpenChange={handleCloseBoxScanDialog}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-testid="box-scan-dialog-home"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent" />
              {t("home.boxScan.title")}
            </DialogTitle>
            <DialogDescription>
              {t("home.boxScan.description")}
            </DialogDescription>
          </DialogHeader>

          {boxPhotoPreview && (
            <div className="mb-4">
              <img
                src={boxPhotoPreview}
                alt={t("home.boxScan.title")}
                className="w-full max-h-48 object-contain rounded-md bg-muted"
              />
            </div>
          )}

          {boxScanLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <p className="text-muted-foreground text-center">
                {t("home.boxScan.analyzing")}
              </p>
            </div>
          ) : boxScanResults ? (
            <div className="space-y-4">
              {boxScanResults.createdKits &&
              boxScanResults.createdKits.length > 0 ? (
                <>
                  <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {t("home.boxScan.kitsRegistered", {
                          count: boxScanResults.createdKits.length,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("home.boxScan.kitsAddedSuccess")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {t("home.boxScan.kitsIdentified")}
                    </h4>
                    {boxScanResults.createdKits.map((kit, index) => (
                      <div
                        key={kit.id || index}
                        className="p-3 rounded-md bg-muted/50 border"
                        data-testid={`scanned-kit-home-${index}`}
                      >
                        <p className="font-medium">{kit.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {kit.brand} - {kit.scale} - {KIT_TYPE_KEYS[kit.type] ? t(`kitForm.types.${KIT_TYPE_KEYS[kit.type]}`) : kit.type}
                        </p>
                      </div>
                    ))}
                  </div>

                  {boxScanResults.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      {boxScanResults.notes}
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-md bg-muted/50 text-center">
                  <p className="text-muted-foreground">
                    {t("home.boxScan.noKitsFound")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("home.boxScan.tryBetterPhoto")}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            {boxScanResults?.createdKits &&
            boxScanResults.createdKits.length > 0 ? (
              <Button
                onClick={handleCloseBoxScanDialog}
                data-testid="button-close-scan-home"
              >
                {t("home.boxScan.close")}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseBoxScanDialog}>
                  {t("home.boxScan.close")}
                </Button>
                <Button onClick={() => boxPhotoCameraRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("home.boxScan.tryAnotherPhoto")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
