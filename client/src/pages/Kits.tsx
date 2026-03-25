import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const KIT_TYPE_KEYS: Record<string, string> = {
  "Avião": "airplane",
  "Helicóptero": "helicopter",
  "Militaria": "military",
  "Veículo": "vehicle",
  "Navio": "ship",
  "Submarino": "submarine",
  "Figura": "figure",
  "Diorama": "diorama",
  "Sci-Fi": "scifi",
  "Outro": "other",
};
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Package,
  ArrowUpDown,
  Camera,
  Loader2,
  CheckCircle2,
  Upload,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Check,
} from "lucide-react";
import { exportToPdf, exportToExcel } from "@/lib/exportUtils";
import DownloadPremiumModal from "@/components/DownloadPremiumModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SearchInput from "@/components/SearchInput";
import FilterBar from "@/components/FilterBar";
import KitListItem from "@/components/KitListItem";
import KitForm from "@/components/KitForm";
import UpgradeModal from "@/components/UpgradeModal";
import ShareButton from "@/components/ShareButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Kit } from "@/components/KitCard";
import type { KitStatus } from "@/components/StatusBadge";
import type { KitDestino } from "@/components/DestinoBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SortOption = "recent" | "alphabetical";

interface KitsProps {
  kits: Kit[];
  onAddKit: (kit: Omit<Kit, "id">) => void;
  onEditKit: (kit: Kit) => void;
  onDeleteKit: (id: string) => void;
  onDuplicateKit: (id: string) => void;
  isSavingKit?: boolean;
}

const ITEMS_PER_PAGE = 50;

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

export default function Kits({
  kits,
  onAddKit,
  onEditKit,
  onDeleteKit,
  onDuplicateKit,
  isSavingKit,
}: KitsProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<KitStatus | "all">("all");
  const [destinoFilter, setDestinoFilter] = useState<KitDestino | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scaleFilter, setScaleFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kitToDelete, setKitToDelete] = useState<Kit | null>(null);
  const [activeTab, setActiveTab] = useState<"todos" | "a_venda" | "vendidos">(
    "todos",
  );
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [downloadPremiumOpen, setDownloadPremiumOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [boxScanDialogOpen, setBoxScanDialogOpen] = useState(false);
  const [boxScanLoading, setBoxScanLoading] = useState(false);
  const [boxPhotoPreview, setBoxPhotoPreview] = useState<string | null>(null);
  const [boxScanResults, setBoxScanResults] = useState<{
    kits: { name: string; brand: string; scale: string; type: string }[];
    notes: string;
    createdKits: Kit[];
  } | null>(null);
  const boxPhotoCameraRef = useRef<HTMLInputElement>(null);
  const boxPhotoGalleryRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  /* =========================
     RESET PAGINAÇÃO AO FILTRAR
  ========================= */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    destinoFilter,
    typeFilter,
    scaleFilter,
    brandFilter,
    activeTab,
  ]);

  /* =========================
     LISTAS SEGURAS
  ========================= */
  const safeLower = (v?: string | null) => (v || "").toLowerCase();

  const kitsNotSold = useMemo(
    () => kits.filter((k) => k.destino !== "vendido"),
    [kits],
  );
  const kitsForSale = useMemo(
    () =>
      kits.filter(
        (k) =>
          (k.isForSale || k.destino === "a_venda") && k.destino !== "vendido",
      ),
    [kits],
  );
  const kitsSold = useMemo(
    () => kits.filter((k) => k.destino === "vendido"),
    [kits],
  );

  const filteredKits = useMemo(() => {
    let base = kits;
    if (activeTab === "a_venda") base = kitsForSale;
    if (activeTab === "vendidos") base = kitsSold;

    const result = base.filter((kit) => {
      const matchesSearch =
        !search ||
        safeLower(kit.name).includes(safeLower(search)) ||
        safeLower(kit.brand).includes(safeLower(search)) ||
        safeLower(kit.type).includes(safeLower(search));

      const matchesStatus =
        statusFilter === "all" || kit.status === statusFilter;
      const matchesDestino =
        destinoFilter === "all" || kit.destino === destinoFilter;
      const matchesType =
        typeFilter === "all" || safeLower(kit.type) === safeLower(typeFilter);
      const matchesScale =
        scaleFilter === "all" ||
        safeLower(kit.scale) === safeLower(scaleFilter);
      const matchesBrand =
        brandFilter === "all" ||
        safeLower(kit.brand) === safeLower(brandFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDestino &&
        matchesType &&
        matchesScale &&
        matchesBrand
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "alphabetical") {
        return safeLower(a.name).localeCompare(safeLower(b.name), "pt-BR");
      }
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [
    kits,
    kitsForSale,
    kitsSold,
    activeTab,
    search,
    statusFilter,
    destinoFilter,
    typeFilter,
    scaleFilter,
    brandFilter,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredKits.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedKits = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredKits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredKits, safePage]);

  /* =========================
     AÇÕES
  ========================= */
  const handleSave = (kit: Omit<Kit, "id"> & { id?: string }) => {
    if (kit.id) onEditKit(kit as Kit);
    else onAddKit(kit);
    setEditingKit(null);
  };

  const confirmDelete = () => {
    if (kitToDelete) onDeleteKit(kitToDelete.id);
    setKitToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleBoxPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const res = await fetch("/api/ai/scan-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ image: base64 }),
        });
        if (!res.ok) throw new Error("Erro na API");
        const data = await res.json();
        setBoxScanResults(data);
        queryClient.refetchQueries({ queryKey: ["/api/kits"] });
        queryClient.refetchQueries({ queryKey: ["/api/usage"] });
        toast({
          title: t('home.boxScan.successToast'),
          description: t('home.boxScan.successDescription', { count: data.kits.length }),
        });
      } catch (err) {
        console.error(err);
        toast({
          title: t('home.boxScan.errorProcessing'),
          description: t('home.boxScan.tryBetterPhoto'),
          variant: "destructive",
        });
        setBoxScanDialogOpen(false);
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

  const isFreeUser = user?.status === 'free';

  const getKitColumns = () => [
    { header: t('common.name'), accessor: 'name' },
    { header: t('common.brand'), accessor: 'brand' },
    { header: t('common.scale'), accessor: 'scale' },
    { header: t('common.type'), accessor: (row: Kit) => KIT_TYPE_KEYS[row.type] ? t(`kitForm.types.${KIT_TYPE_KEYS[row.type]}`) : row.type },
    { header: t('common.status'), accessor: (row: Kit) => t(`kits.status.${row.status}`, row.status) },
    { header: t('kits.paidValue'), accessor: (row: Kit) => row.paidValue ? `R$ ${row.paidValue.toFixed(2)}` : '' },
    { header: t('kits.hoursWorked'), accessor: (row: Kit) => row.hoursWorked ? row.hoursWorked.toFixed(1) : '' },
  ];

  const handleDownloadPdf = () => {
    if (isFreeUser) {
      setDownloadPremiumOpen(true);
      return;
    }
    const columns = getKitColumns();
    const tabName = activeTab === 'todos' ? t('kits.title') : activeTab === 'a_venda' ? t('kits.tabs.forSale') : t('kits.tabs.sold');
    exportToPdf(filteredKits, columns, tabName, `kits_${activeTab}`);
    toast({ title: t('toasts.downloadStarted') });
  };

  const handleDownloadExcel = () => {
    if (isFreeUser) {
      setDownloadPremiumOpen(true);
      return;
    }
    const columns = getKitColumns();
    const tabName = activeTab === 'todos' ? t('kits.title') : activeTab === 'a_venda' ? t('kits.tabs.forSale') : t('kits.tabs.sold');
    exportToExcel(filteredKits, columns, tabName, `kits_${activeTab}`);
    toast({ title: t('toasts.downloadStarted') });
  };

  /* =========================
     RENDER
  ========================= */
  
  const handleOpenForm = () => {
    if (usage && !usage.canAddItem) {
      setUpgradeModalOpen(true);
    } else {
      setFormOpen(true);
    }
  };

  if (kits.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold">{t('kits.title')}</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="border-2 border-secondary bg-secondary/5 max-w-lg w-full" data-testid="alert-empty-kits-collection">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
                <Package className="w-10 h-10 text-secondary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-secondary">
                  {t('kits.emptyState.title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('kits.emptyState.subtitle')}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{t('kits.emptyState.benefit1')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{t('kits.emptyState.benefit2')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>{t('kits.emptyState.benefit3')}</span>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <Button 
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white w-full"
                  onClick={handleOpenForm}
                  data-testid="button-first-kit-kits-cta"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('kits.emptyState.button')}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t('kits.emptyState.note')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <KitForm
          open={formOpen}
          onOpenChange={setFormOpen}
          kit={editingKit}
          onSave={handleSave}
          isSaving={isSavingKit}
        />

        <UpgradeModal
          open={upgradeModalOpen}
          onOpenChange={setUpgradeModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">{t('kits.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          <ShareButton page="kits" />
          <Button 
            variant="secondary" 
            onClick={handleOpenForm}
            data-testid="button-new-kit-kits"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('home.newKit')}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleDownloadPdf} data-testid="button-download-pdf-kits">
                <FileText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.downloadPdf')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleDownloadExcel} data-testid="button-download-excel-kits">
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.downloadExcel')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {kits.length >= 1 && kits.length <= 2 && (
        <Card className="border-secondary/50 bg-secondary/5" data-testid="card-progress-collection">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">{t('kits.progressState.title')}</p>
                <Progress value={(kits.length / 3) * 100} className="h-2" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-secondary" />
                  <p className="text-sm text-muted-foreground">
                    {t('kits.progressState.progress', { current: kits.length })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('kits.progressState.remaining', { remaining: 3 - kits.length })}
                </p>
              </div>
              <Button 
                variant="secondary"
                onClick={handleOpenForm}
                data-testid="button-progress-add-kit"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('kits.progressState.button')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {kits.length >= 3 && kits.length <= 4 && (
        <Card className="border-secondary/50 bg-secondary/5" data-testid="card-habit-reinforcement">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">{t('kits.habitState.title')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('kits.habitState.description')}
                </p>
              </div>
              <Button 
                variant="secondary"
                onClick={handleOpenForm}
                data-testid="button-habit-add-kit"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('kits.habitState.button')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="todos">{t('kits.tabs.all')} ({kits.length})</TabsTrigger>
          <TabsTrigger value="a_venda">
            {t('kits.tabs.forSale')} ({kitsForSale.length})
          </TabsTrigger>
          <TabsTrigger value="vendidos">
            {t('kits.tabs.sold')} ({kitsSold.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchInput value={search} onChange={setSearch} placeholder={t('kits.searchPlaceholder')} />

      {kits.length >= 6 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar
            statusFilter={statusFilter}
            destinoFilter={destinoFilter}
            typeFilter={typeFilter}
            scaleFilter={scaleFilter}
            brandFilter={brandFilter}
            types={Array.from(new Set(kits.map((k) => k.type).filter(Boolean))).sort()}
            scales={Array.from(new Set(kits.map((k) => k.scale).filter(Boolean))).sort()}
            brands={Array.from(new Set(kits.map((k) => k.brand).filter(Boolean))).sort()}
            onStatusChange={setStatusFilter}
            onDestinoChange={setDestinoFilter}
            onTypeChange={setTypeFilter}
            onScaleChange={setScaleFilter}
            onBrandChange={setBrandFilter}
            onClearFilters={() => {
              setStatusFilter("all");
              setDestinoFilter("all");
              setTypeFilter("all");
              setScaleFilter("all");
              setBrandFilter("all");
            }}
          />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('common.sort')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('kits.sortRecent')}</SelectItem>
              <SelectItem value="alphabetical">{t('kits.sortAlphabetical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {paginatedKits.length > 0 ? (
        <>
          {paginatedKits.map((kit) => (
            <KitListItem
              key={kit.id}
              {...kit}
              onEdit={() => {
                setEditingKit(kit);
                setFormOpen(true);
              }}
              onDelete={() => {
                setKitToDelete(kit);
                setDeleteDialogOpen(true);
              }}
              onDuplicate={() => onDuplicateKit(kit.id)}
            />
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.previous')}
              </Button>

              <span className="text-sm">
                {t('common.page', { current: safePage, total: totalPages })}
              </span>

              <Button
                variant="outline"
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                {t('common.next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{t('kits.noKits')}</p>
        </div>
      )}

      <KitForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kit={editingKit}
        onSave={handleSave}
        isSaving={isSavingKit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('kits.deleteKit')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmations.deleteKit')} "{kitToDelete?.name}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />

      <Dialog open={boxScanDialogOpen} onOpenChange={handleCloseBoxScanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {boxScanLoading
                ? t('home.boxScan.analyzing')
                : boxScanResults
                  ? t('home.boxScan.kitsRegistered', { count: boxScanResults.kits.length })
                  : t('home.boxScan.title')}
            </DialogTitle>
            <DialogDescription>
              {boxScanLoading
                ? t('home.boxScan.description')
                : t('home.boxScan.kitsAddedSuccess')}
            </DialogDescription>
          </DialogHeader>

          {boxPhotoPreview && (
            <img
              src={boxPhotoPreview}
              alt={t('home.boxScan.title')}
              className="w-full rounded-md mb-4"
            />
          )}

          {boxScanLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {boxScanResults && !boxScanLoading && (
            <div className="space-y-4">
              {boxScanResults.kits.map((kit, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-muted rounded-md"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{kit.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {kit.brand} - {kit.scale} - {KIT_TYPE_KEYS[kit.type] ? t(`kitForm.types.${KIT_TYPE_KEYS[kit.type]}`) : kit.type}
                    </p>
                  </div>
                </div>
              ))}

              {boxScanResults.notes && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {boxScanResults.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseBoxScanDialog}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DownloadPremiumModal
        open={downloadPremiumOpen}
        onOpenChange={setDownloadPremiumOpen}
      />
    </div>
  );
}
