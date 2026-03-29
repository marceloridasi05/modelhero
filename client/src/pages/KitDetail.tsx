import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import ShareButton from "@/components/ShareButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Play,
  Square,
  Clock,
  Plus,
  Trash2,
  Image,
  FileText,
  Palette,
  Edit2,
  DollarSign,
  Upload,
  Layers,
  Save,
  Package,
  Link,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  ChevronsUpDown,
  Shield,
  Plane,
  MessageSquare,
  BookOpen,
  Wrench,
  Camera,
  Sparkles,
  ExternalLink,
  ShoppingCart,
  Loader2,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  Eye,
  Wrench as WrenchIcon,
  ShieldCheck,
  Tag,
  GripVertical,
  RotateCw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Kit, Paint, ReferenceFile, KitEtapa } from "@/components/KitCard";
import StatusBadge from "@/components/StatusBadge";
import DestinoBadge from "@/components/DestinoBadge";
import RatingStars from "@/components/RatingStars";
import KitForm from "@/components/KitForm";
import { PAINT_BRANDS } from "@/lib/paintBrands";
import {
  getPaintCodesForBrand,
  getBrandsWithCodes,
  findPaintsByFsCode,
  findPaintsByName,
  findPaintsByRlmCode,
  findPaintsByRalCode,
} from "@/lib/paintCodes";
import { FS_CODES, findMatchingFSCode } from "@/lib/fsCodes";
import {
  findPaintsFromConversionsByName,
  COLOR_SCHEME_DATABASE,
  type CamouflageScheme,
  type ColorCode,
  findByFsCode,
  findByRlmCode,
  findByRalCode,
} from "@/lib/paintConversions";
import { useCurrency, type CurrencyCode } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import UploadLoadingModal from "@/components/UploadLoadingModal";
import CopilotUpgradeModal from "@/components/CopilotUpgradeModal";
import { useKitImageUpload } from "@/hooks/use-kit-image-upload";

interface SortablePaintItemProps {
  paint: Paint;
  onSearchMarketplace: (paint: Paint) => void;
  onRemove: (paintId: string) => void;
}

function SortablePaintItem({
  paint,
  onSearchMarketplace,
  onRemove,
}: SortablePaintItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
      data-testid={`paint-item-${paint.id}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1"
        data-testid={`drag-handle-${paint.id}`}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      {paint.color && (
        <div
          className="w-6 h-6 rounded-md border"
          style={{ backgroundColor: paint.color }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{paint.name}</p>
        <p className="text-sm text-muted-foreground">
          {paint.brand} {paint.code && `- ${paint.code}`}
          {paint.fsCode && ` | FS ${paint.fsCode}`}
          {paint.rlmCode && ` | RLM ${paint.rlmCode}`}
          {paint.ralCode && ` | RAL ${paint.ralCode}`}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onSearchMarketplace(paint)}
        title={t("kitDetail.marketplace.title")}
        data-testid={`button-search-marketplace-${paint.id}`}
      >
        <ShoppingCart className="w-4 h-4 text-accent" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onRemove(paint.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface KitDetailProps {
  kit: Kit | null;
  onEditKit: (kit: Kit) => void;
  onBack: () => void;
  isSavingKit?: boolean;
}

export default function KitDetail({
  kit: listKit,
  onEditKit,
  onBack,
  isSavingKit,
}: KitDetailProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { language } = useLanguage();

  const { data: fullKit } = useQuery<Kit>({
    queryKey: ["/api/kits", listKit?.id],
    enabled: !!listKit?.id,
  });

  const kit = fullKit || listKit;

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const isFreeUser = user?.status === "free";
  const maxPhotos = isFreeUser ? 2 : 15;
  const { convert, formatCurrency, preferredCurrency } = useCurrency();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [paintDialogOpen, setPaintDialogOpen] = useState(false);
  const [newPaint, setNewPaint] = useState<Partial<Paint>>({});
  const [editableProgress, setEditableProgress] = useState(kit?.progress || 0);
  const [boxImageDialogOpen, setBoxImageDialogOpen] = useState(false);
  const [boxImageUrl, setBoxImageUrl] = useState("");
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<ReferenceFile | null>(null);
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [codePopoverOpen, setCodePopoverOpen] = useState(false);
  const [fsPopoverOpen, setFsPopoverOpen] = useState(false);
  const [fsSearchTerm, setFsSearchTerm] = useState("");
  const [fsSearchResults, setFsSearchResults] = useState<
    {
      brand: string;
      paint: { code: string; name: string; color?: string; fsCode?: string };
    }[]
  >([]);
  const [nameSearchResults, setNameSearchResults] = useState<
    {
      brand: string;
      paint: { code: string; name: string; color?: string; fsCode?: string };
    }[]
  >([]);
  const [namePopoverOpen, setNamePopoverOpen] = useState(false);
  const [rlmSearchTerm, setRlmSearchTerm] = useState("");
  const [rlmSearchResults, setRlmSearchResults] = useState<
    {
      brand: string;
      paint: { code: string; name: string; color?: string; rlmCode?: string };
    }[]
  >([]);
  const [rlmPopoverOpen, setRlmPopoverOpen] = useState(false);
  const [ralSearchTerm, setRalSearchTerm] = useState("");
  const [ralSearchResults, setRalSearchResults] = useState<
    { brand: string; paint: { code: string; name: string; color?: string } }[]
  >([]);
  const [ralPopoverOpen, setRalPopoverOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isRotatingBoxImage, setIsRotatingBoxImage] = useState(false);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const referencePhotoInputRef = useRef<HTMLInputElement>(null);
  const buildPhotoInputRef = useRef<HTMLInputElement>(null);
  const referenceDocumentsInputRef = useRef<HTMLInputElement>(null);
  const nameSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkDescription, setNewLinkDescription] = useState("");
  const [buildPhotoGalleryOpen, setBuildPhotoGalleryOpen] = useState(false);
  const [currentBuildPhotoIndex, setCurrentBuildPhotoIndex] = useState(0);
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceResults, setMarketplaceResults] = useState<{
    searchLinks: { query: string; url: string }[];
    category: string;
    tips: string;
  } | null>(null);
  const [selectedPaintForSearch, setSelectedPaintForSearch] =
    useState<Paint | null>(null);
  const [copilotDialogOpen, setCopilotDialogOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotUpgradeOpen, setCopilotUpgradeOpen] = useState(false);
  const [copilotLimitReached, setCopilotLimitReached] = useState(false);
  const [copilotResults, setCopilotResults] = useState<{
    checklist: { item: string; done: boolean }[];
    estimatedTime: string;
    risks: string[];
    materials: string[];
    tips: string;
    isLastFreeUse?: boolean;
  } | null>(null);
  const [photoAnalysisDialogOpen, setPhotoAnalysisDialogOpen] = useState(false);
  const [photoSelectionDialogOpen, setPhotoSelectionDialogOpen] =
    useState(false);
  const [photoAnalysisLoading, setPhotoAnalysisLoading] = useState(false);
  const [schemeDialogOpen, setSchemeDialogOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<CamouflageScheme | null>(
    null,
  );
  const [schemeSearchTerm, setSchemeSearchTerm] = useState("");
  const [schemeCategoryFilter, setSchemeCategoryFilter] =
    useState<string>("all");
  const [schemeBrandSelections, setSchemeBrandSelections] = useState<
    Record<
      string,
      { brand: string; code: string; name: string; color?: string }
    >
  >({});
  const [photoAnalysisResults, setPhotoAnalysisResults] = useState<{
    issues: {
      type: string;
      description: string;
      howToFix: string;
      howToPrevent: string;
    }[];
    overallAssessment: string;
  } | null>(null);
  const [selectedPhotoForAnalysis, setSelectedPhotoForAnalysis] = useState<
    string | null
  >(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const {
    uploadImages,
    uploadBoxImage,
    isUploading: isObjectStorageUploading,
  } = useKitImageUpload();

  const handleFsSearch = (value: string) => {
    setFsSearchTerm(value);
    if (value.length >= 3) {
      const results = findPaintsByFsCode(value);
      setFsSearchResults(results);
    } else {
      setFsSearchResults([]);
    }
  };

  const handleSelectFsSuggestion = (result: {
    brand: string;
    paint: { code: string; name: string; color?: string; fsCode?: string };
  }) => {
    setNewPaint({
      brand: result.brand,
      code: result.paint.code,
      name: result.paint.name,
      color: result.paint.color,
      fsCode: result.paint.fsCode,
    });
    setFsSearchTerm("");
    setFsSearchResults([]);
  };

  const handleRlmSearch = (value: string) => {
    setRlmSearchTerm(value);
    if (value.length >= 2) {
      const results = findPaintsByRlmCode(value);
      setRlmSearchResults(results);
    } else {
      setRlmSearchResults([]);
    }
  };

  const handleSelectRlmSuggestion = (result: {
    brand: string;
    paint: { code: string; name: string; color?: string; rlmCode?: string };
  }) => {
    setNewPaint({
      brand: result.brand,
      code: result.paint.code,
      name: result.paint.name,
      color: result.paint.color,
      rlmCode: result.paint.rlmCode,
    });
    setRlmSearchTerm("");
    setRlmSearchResults([]);
    setRlmPopoverOpen(false);
  };

  const handleRalSearch = (value: string) => {
    setRalSearchTerm(value);
    if (value.length >= 3) {
      const results = findPaintsByRalCode(value);
      setRalSearchResults(results);
    } else {
      setRalSearchResults([]);
    }
  };

  const handleSelectRalSuggestion = (result: {
    brand: string;
    paint: { code: string; name: string; color?: string };
  }) => {
    setNewPaint({
      brand: result.brand,
      code: result.paint.code,
      name: result.paint.name,
      color: result.paint.color,
      ralCode: ralSearchTerm,
    });
    setRalSearchTerm("");
    setRalSearchResults([]);
    setRalPopoverOpen(false);
  };

  const handleSaveFsCodeOnly = () => {
    if (!fsSearchTerm || !kit) return;
    const matchingFs = FS_CODES.find((fs) => fs.code === fsSearchTerm);
    const paint: Paint = {
      id: crypto.randomUUID(),
      brand: "",
      code: "",
      name: matchingFs?.name || `FS ${fsSearchTerm}`,
      fsCode: fsSearchTerm,
      color: matchingFs?.color,
    };
    const updatedKit: Kit = {
      ...kit,
      paints: [paint, ...(kit.paints || [])],
    };
    onEditKit(updatedKit);
    setFsSearchTerm("");
    setFsSearchResults([]);
    setPaintDialogOpen(false);
  };

  useEffect(() => {
    if (kit) {
      setEditableProgress(kit.progress);
    }
  }, [kit?.progress]);

  useEffect(() => {
    if (!kit || editableProgress === kit.progress) return;
    const currentKit = kit;
    const timer = setTimeout(() => {
      onEditKit({ ...currentKit, progress: editableProgress });
    }, 800);
    return () => clearTimeout(timer);
  }, [editableProgress, kit?.id, kit?.progress, onEditKit]);

  useEffect(() => {
    if (kit?.timerStartedAt) {
      setIsTimerRunning(true);
      const startTime =
        typeof kit.timerStartedAt === "string"
          ? parseInt(kit.timerStartedAt)
          : kit.timerStartedAt;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }
  }, [kit?.timerStartedAt]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && kit?.timerStartedAt) {
      interval = setInterval(() => {
        const startTime =
          typeof kit.timerStartedAt === "string"
            ? parseInt(kit.timerStartedAt)
            : kit.timerStartedAt!;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, kit?.timerStartedAt]);

  if (!kit) {
    return (
      <div className="p-4 md:p-6 text-center" data-testid="kit-not-found">
        <p className="text-muted-foreground">{t("kitDetail.notFound")}</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      const additionalHours = elapsedSeconds / 3600;
      const updatedKit: Kit = {
        ...kit,
        hoursWorked: kit.hoursWorked + additionalHours,
        timerStartedAt: null,
      };
      onEditKit(updatedKit);
      setIsTimerRunning(false);
      setElapsedSeconds(0);
    } else {
      const updatedKit: Kit = {
        ...kit,
        timerStartedAt: Date.now(),
        startDate: kit.startDate || new Date(),
      };
      onEditKit(updatedKit);
      setIsTimerRunning(true);
    }
  };

  const handleAddPaint = () => {
    if (!newPaint.brand || !newPaint.name) return;
    const paint: Paint = {
      id: crypto.randomUUID(),
      brand: newPaint.brand || "",
      code: newPaint.code || "",
      name: newPaint.name || "",
      fsCode: newPaint.fsCode,
      rlmCode: newPaint.rlmCode,
      ralCode: newPaint.ralCode,
      color: newPaint.color,
    };
    const updatedKit: Kit = {
      ...kit,
      paints: [paint, ...(kit.paints || [])],
    };
    onEditKit(updatedKit);
    setNewPaint({});
    setPaintDialogOpen(false);
  };

  const handleRemovePaint = (paintId: string) => {
    const updatedKit: Kit = {
      ...kit,
      paints: (kit.paints || []).filter((p) => p.id !== paintId),
    };
    onEditKit(updatedKit);
  };

  const handleApplyScheme = () => {
    if (!selectedScheme) return;

    const newPaints: Paint[] = [];

    // Get colors from scheme (either colorCodes or fsCodes)
    const colors =
      selectedScheme.colorCodes && selectedScheme.colorCodes.length > 0
        ? selectedScheme.colorCodes
        : selectedScheme.fsCodes.map((fs) => ({
            type: "FS" as const,
            code: fs,
          }));

    colors.forEach((colorCode) => {
      const enriched = enrichColorCode(colorCode);
      const colorKey = `${enriched.type}-${enriched.code}`;
      const selection = schemeBrandSelections[colorKey];

      const paint: Paint = {
        id: `scheme-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name:
          selection?.name ||
          enriched.name ||
          `${enriched.type} ${enriched.code}`,
        brand: selection?.brand || "",
        code: selection?.code || "",
        color: selection?.color || enriched.hexColor || "",
        fsCode: enriched.type === "FS" ? enriched.code : undefined,
        rlmCode: enriched.type === "RLM" ? enriched.code : undefined,
        ralCode: enriched.type === "RAL" ? enriched.code : undefined,
      };
      newPaints.push(paint);
    });

    const updatedKit: Kit = {
      ...kit,
      paints: [...(kit.paints || []), ...newPaints],
      colorScheme: selectedScheme.name,
    };
    onEditKit(updatedKit);
    setSchemeDialogOpen(false);
    setSelectedScheme(null);
    setSchemeSearchTerm("");
    setSchemeCategoryFilter("all");
    setSchemeBrandSelections({});

    toast({
      title: t("toasts.success"),
      description: t("kitDetail.paints.schemeApplied", {
        name: selectedScheme.name,
      }),
    });
  };

  // Get matching paints for a color code
  const getMatchingPaintsForCode = (colorCode: ColorCode) => {
    if (colorCode.type === "FS") {
      return findPaintsByFsCode(colorCode.code);
    } else if (colorCode.type === "RLM") {
      return findPaintsByRlmCode(colorCode.code);
    } else if (colorCode.type === "RAL") {
      return findPaintsByRalCode(colorCode.code);
    }
    return [];
  };

  // Get colors from selected scheme
  const getSchemeColors = (scheme: CamouflageScheme): ColorCode[] => {
    if (scheme.colorCodes && scheme.colorCodes.length > 0) {
      return scheme.colorCodes;
    }
    return scheme.fsCodes.map((fs) => ({ type: "FS" as const, code: fs }));
  };

  // Cache for enriched color codes to avoid repeated lookups
  const colorCodeCache = useMemo(() => new Map<string, ColorCode>(), []);

  // Enrich a ColorCode with name and hexColor from the database (cached)
  const enrichColorCode = (colorCode: ColorCode): ColorCode => {
    if (colorCode.hexColor && colorCode.name) {
      return colorCode;
    }

    const cacheKey = `${colorCode.type}-${colorCode.code}`;
    const cached = colorCodeCache.get(cacheKey);
    if (cached) return cached;

    let conversion;
    if (colorCode.type === "FS") {
      conversion = findByFsCode(colorCode.code);
    } else if (colorCode.type === "RLM") {
      const results = findByRlmCode(colorCode.code);
      conversion = results.length > 0 ? results[0] : undefined;
    } else if (colorCode.type === "RAL") {
      const results = findByRalCode(colorCode.code);
      conversion = results.length > 0 ? results[0] : undefined;
    }

    const enriched: ColorCode = conversion
      ? {
          ...colorCode,
          name: colorCode.name || conversion.colorName,
          hexColor: colorCode.hexColor || conversion.hexColor,
        }
      : colorCode;

    colorCodeCache.set(cacheKey, enriched);
    return enriched;
  };

  const handleRemoveScheme = () => {
    const updatedKit: Kit = {
      ...kit,
      colorScheme: undefined,
    };
    onEditKit(updatedKit);
  };

  // Get unique categories from schemes
  const schemeCategories = Array.from(
    new Set(COLOR_SCHEME_DATABASE.map((s) => s.category).filter(Boolean)),
  ) as string[];

  // Filter schemes based on search and category
  const filteredSchemes = COLOR_SCHEME_DATABASE.filter((scheme) => {
    const matchesSearch =
      schemeSearchTerm === "" ||
      scheme.name.toLowerCase().includes(schemeSearchTerm.toLowerCase()) ||
      (scheme.aircraft &&
        scheme.aircraft
          .toLowerCase()
          .includes(schemeSearchTerm.toLowerCase())) ||
      (scheme.period &&
        scheme.period.toLowerCase().includes(schemeSearchTerm.toLowerCase()));
    const matchesCategory =
      schemeCategoryFilter === "all" ||
      scheme.category === schemeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handlePaintDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const paints = kit.paints || [];
    const oldIndex = paints.findIndex((p) => p.id === active.id);
    const newIndex = paints.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setIsSavingOrder(true);
      const reorderedPaints = arrayMove(paints, oldIndex, newIndex);
      const updatedKit: Kit = {
        ...kit,
        paints: reorderedPaints,
      };
      onEditKit(updatedKit);
      setTimeout(() => setIsSavingOrder(false), 500);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "document",
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = (kit.referencePhotos || []).length;

    if (type === "image" && currentCount >= maxPhotos) {
      toast({
        title: t("kitDetail.toasts.limitReached"),
        description: t("kitDetail.toasts.maxPhotos", { max: maxPhotos }),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const remainingSlots = maxPhotos - currentCount;
    const filesToUpload =
      type === "image"
        ? Array.from(files).slice(0, remainingSlots)
        : Array.from(files);

    const fileCount = filesToUpload.length;
    setUploadMessage(t("common.loading"));

    uploadTimeoutRef.current = setTimeout(() => {
      setIsUploading(true);
    }, 1000);

    try {
      if (type === "image") {
        const uploadedImages = await uploadImages(filesToUpload);
        if (uploadedImages.length > 0) {
          const newFiles: ReferenceFile[] = uploadedImages.map((img) => ({
            id: img.id,
            name: img.name,
            type: "image" as const,
            url: img.url,
            thumbnail: img.thumbnail,
          }));
          const updatedKit: Kit = {
            ...kit,
            referencePhotos: [...(kit.referencePhotos || []), ...newFiles],
          };
          onEditKit(updatedKit);
        }
      } else {
        const uploadedDocs = await uploadImages(filesToUpload);
        if (uploadedDocs.length > 0) {
          const newFiles: ReferenceFile[] = uploadedDocs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            type: type as "document",
            url: doc.url,
            thumbnail: doc.thumbnail,
          }));
          const updatedKit: Kit = {
            ...kit,
            referenceDocuments: [
              ...(kit.referenceDocuments || []),
              ...newFiles,
            ],
          };
          onEditKit(updatedKit);
        }
      }
    } finally {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (fileId: string, type: "image" | "document") => {
    const updatedKit: Kit = {
      ...kit,
      ...(type === "image"
        ? {
            referencePhotos: (kit.referencePhotos || []).filter(
              (f) => f.id !== fileId,
            ),
          }
        : {
            referenceDocuments: (kit.referenceDocuments || []).filter(
              (f) => f.id !== fileId,
            ),
          }),
    };
    onEditKit(updatedKit);
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim() || !newLinkDescription.trim() || !kit) return;
    const newLink = {
      id: `link-${Date.now()}`,
      url: newLinkUrl.trim(),
      description: newLinkDescription.trim(),
    };
    const updatedKit: Kit = {
      ...kit,
      usefulLinks: [...(kit.usefulLinks || []), newLink],
    };
    onEditKit(updatedKit);
    setNewLinkUrl("");
    setNewLinkDescription("");
  };

  const handleRemoveLink = (linkId: string) => {
    if (!kit) return;
    const updatedKit: Kit = {
      ...kit,
      usefulLinks: (kit.usefulLinks || []).filter((l) => l.id !== linkId),
    };
    onEditKit(updatedKit);
  };

  const handleBuildPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !kit) return;

    const currentCount = (kit.buildPhotos || []).length;

    if (currentCount >= maxPhotos) {
      toast({
        title: t("kitDetail.toasts.limitReached"),
        description: t("kitDetail.toasts.maxBuildPhotos", { max: maxPhotos }),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const remainingSlots = maxPhotos - currentCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploadMessage(t("common.loading"));

    uploadTimeoutRef.current = setTimeout(() => {
      setIsUploading(true);
    }, 1000);

    try {
      const uploadedImages = await uploadImages(filesToUpload);
      if (uploadedImages.length > 0) {
        const newPhotos: ReferenceFile[] = uploadedImages.map((img) => ({
          id: img.id,
          name: img.name,
          type: "image" as const,
          url: img.url,
          thumbnail: img.thumbnail,
        }));
        const updatedKit: Kit = {
          ...kit,
          buildPhotos: [...(kit.buildPhotos || []), ...newPhotos],
        };
        onEditKit(updatedKit);
      }
    } finally {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveBuildPhoto = (photoId: string) => {
    if (!kit) return;
    const updatedKit: Kit = {
      ...kit,
      buildPhotos: (kit.buildPhotos || []).filter((p) => p.id !== photoId),
    };
    onEditKit(updatedKit);
  };

  const handleOpenBuildPhotoGallery = (index: number) => {
    setCurrentBuildPhotoIndex(index);
    setBuildPhotoGalleryOpen(true);
  };

  const handlePrevBuildPhoto = () => {
    const photos = kit?.buildPhotos || [];
    setCurrentBuildPhotoIndex((prev) =>
      prev === 0 ? photos.length - 1 : prev - 1,
    );
  };

  const handleNextBuildPhoto = () => {
    const photos = kit?.buildPhotos || [];
    setCurrentBuildPhotoIndex((prev) =>
      prev === photos.length - 1 ? 0 : prev + 1,
    );
  };

  const handleSearchMarketplace = async (paint: Paint) => {
    setSelectedPaintForSearch(paint);
    setMarketplaceDialogOpen(true);
    setMarketplaceLoading(true);
    setMarketplaceResults(null);

    try {
      const response = await fetch("/api/paint/search-marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: paint.brand,
          code: paint.code,
          name: paint.name,
          fsCode: paint.fsCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMarketplaceResults(data);
      }
    } catch (error) {
      console.error("Marketplace search error:", error);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const handleCopilotNextStep = async () => {
    if (!kit) return;

    // If limit already reached, show upgrade modal immediately
    if (copilotLimitReached) {
      setCopilotUpgradeOpen(true);
      return;
    }

    setCopilotDialogOpen(true);
    setCopilotLoading(true);
    setCopilotResults(null);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kitName: kit.name,
          kitType: kit.type,
          scale: kit.scale,
          brand: kit.brand,
          status: kit.status,
          etapa: kit.etapa,
          progress: kit.progress,
          hoursWorked: kit.hoursWorked,
          paints: kit.paints
            ?.map((p) => `${p.brand} ${p.code} ${p.name}`)
            .join(", "),
          aftermarkets: kit.aftermarkets,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCopilotResults(data);
        // Mark limit reached if this was the last free use
        if (data.isLastFreeUse) {
          setCopilotLimitReached(true);
        }
      } else if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === "COPILOT_LIMIT_REACHED") {
          setCopilotDialogOpen(false);
          setCopilotLimitReached(true);
          setCopilotUpgradeOpen(true);
        }
      }
    } catch (error) {
      console.error("Copilot error:", error);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handlePhotoAnalysis = async (photoUrl: string) => {
    setSelectedPhotoForAnalysis(photoUrl);
    setPhotoAnalysisDialogOpen(true);
    setPhotoAnalysisLoading(true);
    setPhotoAnalysisResults(null);

    try {
      const response = await fetch("/api/ai/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl,
          kitName: kit?.name,
          kitType: kit?.type,
          scale: kit?.scale,
          etapa: kit?.etapa,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPhotoAnalysisResults(data);
      } else {
        setPhotoAnalysisResults({
          overallAssessment: t("common.errorTryAgain"),
          issues: [],
        });
      }
    } catch (error) {
      console.error("Photo analysis error:", error);
      setPhotoAnalysisResults({
        overallAssessment: t("common.errorTryAgain"),
        issues: [],
      });
    } finally {
      setPhotoAnalysisLoading(false);
    }
  };

  const handleSaveKit = (kitData: Omit<Kit, "id"> & { id?: string }) => {
    onEditKit(kitData as Kit);
  };

  const handleBoxImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadMessage(t("kitDetail.boxImage.uploading"));

    uploadTimeoutRef.current = setTimeout(() => {
      setIsUploading(true);
    }, 1000);

    try {
      const imageUrl = await uploadBoxImage(file);
      if (imageUrl) {
        onEditKit({ ...kit, boxImage: imageUrl });
      }
    } finally {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
      setIsUploading(false);
    }
    e.target.value = "";
  };

  const handleBoxImageUrl = () => {
    if (boxImageUrl.trim()) {
      onEditKit({ ...kit, boxImage: boxImageUrl.trim() });
      setBoxImageUrl("");
      setBoxImageDialogOpen(false);
    }
  };

  const handleRemoveBoxImage = () => {
    onEditKit({ ...kit, boxImage: undefined });
  };

  const handleRotateBoxImage = async () => {
    if (!kit?.boxImage || isRotatingBoxImage) return;
    setIsRotatingBoxImage(true);

    try {
      let imageBlob: Blob;

      if (kit.boxImage.startsWith("data:")) {
        const response = await fetch(kit.boxImage);
        imageBlob = await response.blob();
      } else if (kit.boxImage.startsWith("/objects/")) {
        const response = await fetch(kit.boxImage);
        if (!response.ok) throw new Error("Failed to fetch image");
        imageBlob = await response.blob();
      } else {
        const response = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(kit.boxImage)}`,
        );
        if (!response.ok) throw new Error("Failed to fetch image");
        imageBlob = await response.blob();
      }

      const localUrl = URL.createObjectURL(imageBlob);

      const img = new window.Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = localUrl;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      URL.revokeObjectURL(localUrl);

      const rotatedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.9,
        );
      });

      const rotatedFile = new File([rotatedBlob], `rotated-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const uploadedUrl = await uploadBoxImage(rotatedFile);

      if (uploadedUrl) {
        onEditKit({ ...kit, boxImage: uploadedUrl });
      } else {
        throw new Error("Failed to upload rotated image");
      }
    } catch (err) {
      console.error("Error rotating image:", err);
      toast({
        title: t("kitDetail.boxImage.rotateError"),
        description: t("common.errorTryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsRotatingBoxImage(false);
    }
  };

  const handleOpenPhotoGallery = (index: number) => {
    setCurrentPhotoIndex(index);
    setPhotoGalleryOpen(true);
  };

  const handlePrevPhoto = () => {
    const photos = kit.referencePhotos || [];
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    const photos = kit.referencePhotos || [];
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photoGalleryOpen) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevPhoto();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextPhoto();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPhotoGalleryOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photoGalleryOpen, kit.referencePhotos]);

  const handleOpenPdf = (doc: ReferenceFile) => {
    // Convert data URL to blob URL for better browser compatibility
    if (doc.url.startsWith("data:")) {
      try {
        const byteString = atob(doc.url.split(",")[1]);
        const mimeString = doc.url.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        setCurrentPdf({ ...doc, url: blobUrl });
      } catch (e) {
        // Fallback to original URL if conversion fails
        setCurrentPdf(doc);
      }
    } else {
      setCurrentPdf(doc);
    }
    setPdfViewerOpen(true);
  };

  const handleDownloadDocument = (doc: ReferenceFile) => {
    const link = document.createElement("a");
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert values to preferred currency for display
  const convertedPaidValue = convert(
    kit.paidValue,
    (kit.paidValueCurrency as CurrencyCode) || "BRL",
    preferredCurrency,
  );
  const convertedCurrentValue = convert(
    kit.currentValue,
    "BRL",
    preferredCurrency,
  );
  const convertedSalePrice = convert(
    kit.salePrice || 0,
    "BRL",
    preferredCurrency,
  );

  const valueDiff = convertedCurrentValue - convertedPaidValue;
  const valorization =
    convertedPaidValue > 0 ? (valueDiff / convertedPaidValue) * 100 : 0;

  return (
    <div
      className="p-4 md:p-6 space-y-6 pb-20 md:pb-6"
      data-testid="page-kit-detail"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-semibold truncate"
            data-testid="text-kit-name"
          >
            {kit.name}
          </h1>
          <p className="text-muted-foreground">
            {kit.brand} | {kit.scale} | {KIT_TYPE_KEYS[kit.type] ? t(`kitForm.types.${KIT_TYPE_KEYS[kit.type]}`) : kit.type}
          </p>
        </div>
        <div className="flex gap-2">
          <ShareButton page="kit" kitId={kit.id} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFormOpen(true)}
            data-testid="button-edit-kit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                {t("kitDetail.timer.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-center">
                  <p
                    className="text-4xl font-mono tabular-nums"
                    data-testid="timer-display"
                  >
                    {formatTime(elapsedSeconds)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("kitDetail.timer.currentSession")}
                  </p>
                </div>
                <Button
                  size="lg"
                  className={`min-w-32 ${isTimerRunning ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"} text-white`}
                  onClick={handleToggleTimer}
                  data-testid="button-timer-toggle"
                >
                  {isTimerRunning ? (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      {t("kitDetail.timer.stop")}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {t("kitDetail.timer.start")}
                    </>
                  )}
                </Button>
                <div className="text-center sm:text-left">
                  <p
                    className="text-lg font-medium tabular-nums"
                    data-testid="text-total-hours"
                  >
                    {formatHours(kit.hoursWorked)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("kitDetail.timer.totalAccumulated")}
                  </p>
                </div>
              </div>
              {(kit.startDate || kit.endDate) && (
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-sm">
                  {kit.startDate && (
                    <div data-testid="text-start-date">
                      <span className="text-muted-foreground">
                        {t("kitDetail.timer.startedOn")}:
                      </span>{" "}
                      <span className="font-medium">
                        {new Date(kit.startDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                  {kit.endDate && (
                    <div data-testid="text-end-date">
                      <span className="text-muted-foreground">
                        {t("kitDetail.timer.finishedOn")}:
                      </span>{" "}
                      <span className="font-medium">
                        {new Date(kit.endDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                {t("kitDetail.copilot.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("kitDetail.copilot.description")}
              </p>
              <Button
                onClick={handleCopilotNextStep}
                className="w-full bg-[#f9aa00] hover:bg-[#e09800] text-black border-[#e09800]"
                data-testid="button-copilot-next-step"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t("kitDetail.copilot.nextStep")}
              </Button>
              {copilotLimitReached && isFreeUser && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t("kitDetail.copilot.availableOnFullPlan")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5 text-secondary" />
                  {t("kitDetail.paints.title")}
                  {isSavingOrder && (
                    <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("kitDetail.saving")}
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSchemeDialogOpen(true)}
                    data-testid="button-select-scheme"
                  >
                    <Layers className="w-4 h-4 mr-1" />
                    {t("kitDetail.paints.selectScheme")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaintDialogOpen(true)}
                    data-testid="button-add-paint"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t("kitDetail.paints.add")}
                  </Button>
                </div>
              </div>
              {kit.colorScheme && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Layers className="w-3 h-3" />
                    {t("kitDetail.paints.schemeApplied", {
                      name: kit.colorScheme,
                    })}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleRemoveScheme}
                    data-testid="button-remove-scheme"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {(kit.paints || []).length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePaintDragEnd}
                >
                  <SortableContext
                    items={(kit.paints || []).map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {kit.paints?.map((paint) => (
                        <SortablePaintItem
                          key={paint.id}
                          paint={paint}
                          onSearchMarketplace={handleSearchMarketplace}
                          onRemove={handleRemovePaint}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t("kitDetail.paints.noPaints")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  {t("kitDetail.photos.reference")}
                </CardTitle>
                <div>
                  <input
                    ref={referencePhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "image")}
                    data-testid="input-upload-photos"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => referencePhotoInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {t("common.upload")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(kit.referencePhotos || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {kit.referencePhotos?.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-video"
                      data-testid={`photo-item-${photo.id}`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleOpenPhotoGallery(index)}
                        data-testid={`photo-thumbnail-${photo.id}`}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(photo.id, "image");
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t("kitDetail.photos.noReferencePhotos")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-accent" />
                  {t("kitDetail.photos.build")}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleBuildPhotoUpload}
                      data-testid="input-camera-build-photos"
                    />
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[data-testid="input-camera-build-photos"]'
                        ) as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      {t("kitDetail.photos.takePhoto")}
                    </Button>
                  </div>
                  <div>
                    <input
                      ref={buildPhotoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleBuildPhotoUpload}
                      data-testid="input-upload-build-photos"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => buildPhotoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {t("common.upload")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(kit.buildPhotos || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {kit.buildPhotos?.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-video"
                      data-testid={`build-photo-item-${photo.id}`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleOpenBuildPhotoGallery(index)}
                        data-testid={`build-photo-thumbnail-${photo.id}`}
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBuildPhoto(photo.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t("kitDetail.photos.noBuildPhotos")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="w-5 h-5 text-secondary" />
                {t("kitDetail.links.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(kit.usefulLinks || []).length > 0 && (
                <div className="space-y-2">
                  {kit.usefulLinks?.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                      data-testid={`link-item-${link.id}`}
                    >
                      <Link className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline truncate block"
                          data-testid={`link-url-${link.id}`}
                        >
                          {link.description}
                        </a>
                        <p className="text-xs text-muted-foreground truncate">
                          {link.url}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveLink(link.id)}
                        data-testid={`button-remove-link-${link.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 pt-2 border-t">
                <Input
                  placeholder={t("kitDetail.links.urlPlaceholder")}
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  data-testid="input-link-url"
                />
                <Input
                  placeholder={t("kitDetail.links.descriptionPlaceholder")}
                  value={newLinkDescription}
                  onChange={(e) => setNewLinkDescription(e.target.value)}
                  data-testid="input-link-description"
                />
                <Button
                  size="sm"
                  onClick={handleAddLink}
                  disabled={!newLinkUrl.trim() || !newLinkDescription.trim()}
                  data-testid="button-add-link"
                >
                  <Plus className="w-4 h-4 mr-1" />{" "}
                  {t("kitDetail.links.addLink")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  {t("kitDetail.documents.title")}
                </CardTitle>
                <div>
                  <input
                    ref={referenceDocumentsInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "document")}
                    data-testid="input-upload-docs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => referenceDocumentsInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {t("common.upload")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(kit.referenceDocuments || []).length > 0 ? (
                <div className="space-y-2">
                  {kit.referenceDocuments?.map((doc) => {
                    const isPdf = doc.name.toLowerCase().endsWith(".pdf");
                    const handleDocClick = () => {
                      if (isPdf) {
                        handleOpenPdf(doc);
                      } else {
                        window.open(doc.url, "_blank");
                      }
                    };
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={handleDocClick}
                        data-testid={`doc-item-${doc.id}`}
                      >
                        <FileText className="w-8 h-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("kitDetail.documents.clickToView")}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(doc.id, "document");
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t("kitDetail.documents.noDocuments")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-secondary" />
                  {t("kitDetail.boxImage.title")}
                </CardTitle>
                {!kit.boxImage && (
                  <div className="flex gap-1">
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBoxImageUpload}
                        data-testid="input-upload-box-image"
                      />
                      <Button size="sm" variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                        </span>
                      </Button>
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBoxImageDialogOpen(true)}
                      data-testid="button-box-image-url"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {kit.boxImage ? (
                <div className="relative group aspect-video rounded-md overflow-hidden bg-muted">
                  <img
                    src={kit.boxImage}
                    alt={t("kitDetail.boxImage.boxAlt")}
                    className="w-full h-full object-cover"
                    data-testid="img-box-image"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-7 h-7"
                      onClick={handleRotateBoxImage}
                      disabled={isRotatingBoxImage}
                      data-testid="button-rotate-box-image"
                    >
                      <RotateCw
                        className={cn(
                          "w-4 h-4",
                          isRotatingBoxImage && "animate-spin",
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-7 h-7"
                      onClick={handleRemoveBoxImage}
                      data-testid="button-remove-box-image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-md bg-muted/50 flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {t("kitDetail.info.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="cursor-pointer hover:opacity-80 transition-opacity" data-testid="trigger-status">
                      <StatusBadge status={kit.status} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    {(["na_caixa", "em_andamento", "iniciado_parado", "montado", "aguardando_reforma"] as const).map((s) => (
                      <button
                        key={s}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left", kit.status === s && "bg-accent/10 font-medium")}
                        onClick={() => { onEditKit({ ...kit, status: s }); }}
                        data-testid={`option-status-${s}`}
                      >
                        {kit.status === s && <Check className="w-3 h-3 text-accent" />}
                        <span className={kit.status !== s ? "ml-5" : ""}>{t(`kits.status.${s}`)}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="cursor-pointer hover:opacity-80 transition-opacity" data-testid="trigger-destino">
                      {kit.destino && kit.destino !== "nenhum" ? (
                        <DestinoBadge destino={kit.destino} />
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">{t("kitDetail.info.destino")}</Badge>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    {(["nenhum", "exposto_em_casa", "a_venda", "vendido", "doado", "emprestado", "descartado"] as const).map((d) => (
                      <button
                        key={d}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left", kit.destino === d && "bg-accent/10 font-medium")}
                        onClick={() => { onEditKit({ ...kit, destino: d }); }}
                        data-testid={`option-destino-${d}`}
                      >
                        {kit.destino === d && <Check className="w-3 h-3 text-accent" />}
                        <span className={kit.destino !== d ? "ml-5" : ""}>{d === "nenhum" ? t("common.none") : t(`kits.destino.${d}`)}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {kit.tematica && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="cursor-pointer hover:opacity-80 transition-opacity" data-testid="trigger-tematica">
                        <Badge variant={kit.tematica === "militar" ? "default" : "secondary"} className="text-xs">
                          {kit.tematica === "militar" && <Shield className="w-3 h-3 mr-1" />}
                          {kit.tematica === "militar" ? t("kitDetail.info.military") : t("kitDetail.info.civil")}
                        </Badge>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="start">
                      {(["civil", "militar"] as const).map((tm) => (
                        <button
                          key={tm}
                          className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left", kit.tematica === tm && "bg-accent/10 font-medium")}
                          onClick={() => { onEditKit({ ...kit, tematica: tm }); }}
                          data-testid={`option-tematica-${tm}`}
                        >
                          {kit.tematica === tm && <Check className="w-3 h-3 text-accent" />}
                          <span className={kit.tematica !== tm ? "ml-5" : ""}>{tm === "militar" ? t("kitDetail.info.military") : t("kitDetail.info.civil")}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {kit.recipientName &&
                (kit.destino === "vendido" ||
                  kit.destino === "doado" ||
                  kit.destino === "emprestado") && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("kitDetail.info.recipientName")}
                    </p>
                    <p
                      className="font-medium"
                      data-testid="text-recipient-name"
                    >
                      {kit.recipientName}
                    </p>
                  </div>
                )}

              {kit.status === "em_andamento" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("kitDetail.info.currentStage")}
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" data-testid="trigger-etapa">
                        <Layers className="w-4 h-4 text-accent" />
                        <Badge variant="outline" data-testid="badge-etapa">
                          {kit.etapa ? t(`kitDetail.etapas.${kit.etapa}`) : t("kitDetail.info.currentStage")}
                        </Badge>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="start">
                      {(["montagem", "emassamento", "pintura", "verniz", "decais", "pannel_line", "wash", "weathering", "finalizacao"] as const).map((et) => (
                        <button
                          key={et}
                          className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left", kit.etapa === et && "bg-accent/10 font-medium")}
                          onClick={() => { onEditKit({ ...kit, etapa: et }); }}
                          data-testid={`option-etapa-${et}`}
                        >
                          {kit.etapa === et && <Check className="w-3 h-3 text-accent" />}
                          <span className={kit.etapa !== et ? "ml-5" : ""}>{t(`kitDetail.etapas.${et}`)}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("kitDetail.info.rating")}
                </p>
                <RatingStars
                  rating={kit.rating}
                  onRatingChange={(newRating) => {
                    onEditKit({ ...kit, rating: newRating });
                  }}
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("kitDetail.info.progress")} ({editableProgress}%)
                </p>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[editableProgress]}
                  onValueChange={(value) => setEditableProgress(value[0])}
                  className="flex-1"
                  data-testid="slider-progress"
                />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t("kitDetail.info.values")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("kitDetail.info.paid")}
                    </p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(convertedPaidValue, preferredCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("kitDetail.info.current")}
                    </p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(convertedCurrentValue, preferredCurrency)}
                    </p>
                  </div>
                </div>
                {kit.paidValue > 0 && kit.currentValue > 0 && (
                  <p
                    className={`text-sm tabular-nums mt-2 ${valueDiff >= 0 ? "text-accent" : "text-destructive"}`}
                  >
                    {valueDiff >= 0 ? "+" : ""}
                    {formatCurrency(valueDiff, preferredCurrency)} (
                    {valorization >= 0 ? "+" : ""}
                    {valorization.toFixed(1)}%)
                  </p>
                )}
              </div>

              {(kit.destino === "a_venda" ||
                kit.destino === "vendido" ||
                kit.isForSale) && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t("kitDetail.info.sale")}
                      </span>
                    </div>
                    <Badge
                      variant={
                        kit.destino === "vendido" ? "default" : "secondary"
                      }
                      className={kit.destino === "vendido" ? "bg-accent" : ""}
                      data-testid="badge-sale-status"
                    >
                      {kit.destino === "vendido" ? t("kits.destino.vendido") : t("kits.destino.a_venda")}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("kitDetail.info.salePrice")}
                      </p>
                      <p
                        className="font-medium tabular-nums text-lg text-accent"
                        data-testid="text-sale-price"
                      >
                        {formatCurrency(convertedSalePrice, preferredCurrency)}
                      </p>
                    </div>

                    {kit.destino === "vendido" &&
                      kit.paidValue > 0 &&
                      kit.salePrice && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t("kitDetail.info.profit")}</p>
                          <p
                            className={`font-medium tabular-nums ${convertedSalePrice - convertedPaidValue >= 0 ? "text-accent" : "text-destructive"}`}
                            data-testid="text-profit"
                          >
                            {convertedSalePrice - convertedPaidValue >= 0
                              ? "+"
                              : ""}
                            {formatCurrency(
                              convertedSalePrice - convertedPaidValue,
                              preferredCurrency,
                            )}
                          </p>
                        </div>
                      )}

                    {kit.destino !== "vendido" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-dashed">
                        <Checkbox
                          id="kit-vendido"
                          checked={false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onEditKit({
                                ...kit,
                                destino: "vendido",
                                isForSale: false,
                                soldDate: new Date(),
                              });
                            }
                          }}
                          data-testid="checkbox-kit-vendido"
                        />
                        <label
                          htmlFor="kit-vendido"
                          className="text-sm cursor-pointer font-medium"
                        >
                          {t("kitDetail.info.markAsSold")}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {kit.aftermarkets && kit.aftermarkets.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t("kitDetail.aftermarket.title")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kit.aftermarkets.map((am) => (
                      <Badge
                        key={am}
                        variant="outline"
                        className="text-xs"
                        data-testid={`badge-aftermarket-${am}`}
                      >
                        {t(`kitDetail.aftermarket.${am}`, am)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {kit.tematica === "militar" &&
                kit.militaryInfo &&
                typeof kit.militaryInfo === "object" &&
                Object.values(kit.militaryInfo).some((v) => v) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t("kitForm.militaryInfo")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {kit.militaryInfo.paintScheme && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("kitForm.paintScheme")}
                          </p>
                          <p
                            className="font-medium"
                            data-testid="text-paint-scheme"
                          >
                            {kit.militaryInfo.paintScheme}
                          </p>
                        </div>
                      )}
                      {kit.militaryInfo.epoch && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t("kitForm.epoch")}</p>
                          <p className="font-medium" data-testid="text-epoch">
                            {kit.militaryInfo.epoch}
                          </p>
                        </div>
                      )}
                      {kit.militaryInfo.airForce && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("kitForm.airForce")}
                          </p>
                          <p
                            className="font-medium"
                            data-testid="text-air-force"
                          >
                            {kit.militaryInfo.airForce}
                          </p>
                        </div>
                      )}
                      {kit.militaryInfo.army && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t("kitForm.armyNavy")}
                          </p>
                          <p className="font-medium" data-testid="text-army">
                            {kit.militaryInfo.army}
                          </p>
                        </div>
                      )}
                      {kit.militaryInfo.unit && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">
                            {t("kitForm.unitSquadron")}
                          </p>
                          <p className="font-medium" data-testid="text-unit">
                            {kit.militaryInfo.unit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {kit.comments && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t("kitForm.comments")}
                    </span>
                  </div>
                  <p
                    className="text-sm whitespace-pre-wrap"
                    data-testid="text-comments"
                  >
                    {kit.comments}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {kit.instructionImages && kit.instructionImages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Instrucoes e Decais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {kit.instructionImages.map((img, index) => (
                    <div
                      key={index}
                      className="relative group aspect-video"
                      data-testid={`instruction-item-${index}`}
                    >
                      <img
                        src={img}
                        alt={`Instrucao ${index + 1}`}
                        className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setCurrentPhotoIndex(0);
                          setPhotoGalleryOpen(true);
                        }}
                        data-testid={`instruction-thumbnail-${index}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scheme Selection Dialog */}
      <Dialog
        open={schemeDialogOpen}
        onOpenChange={(open) => {
          setSchemeDialogOpen(open);
          if (!open) {
            setSchemeSearchTerm("");
            setSchemeCategoryFilter("all");
            setSelectedScheme(null);
            setSchemeBrandSelections({});
          }
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[80vh]"
          data-testid="scheme-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("kitDetail.schemeSelector.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedScheme ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder={t("kitDetail.schemeSelector.search")}
                    value={schemeSearchTerm}
                    onChange={(e) => setSchemeSearchTerm(e.target.value)}
                    className="flex-1"
                    data-testid="input-scheme-search"
                  />
                  <select
                    value={schemeCategoryFilter}
                    onChange={(e) => setSchemeCategoryFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-background text-foreground"
                    data-testid="select-scheme-category"
                  >
                    <option value="all">
                      {t("kitDetail.schemeSelector.allCategories")}
                    </option>
                    {schemeCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-2">
                  {filteredSchemes.length > 0 ? (
                    filteredSchemes.map((scheme, index) => (
                      <div
                        key={`${scheme.name}-${index}`}
                        className="p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => setSelectedScheme(scheme)}
                        data-testid={`scheme-item-${index}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {scheme.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {scheme.category && (
                                <Badge variant="outline" className="mr-1">
                                  {scheme.category}
                                </Badge>
                              )}
                              {scheme.aircraft && (
                                <span>{scheme.aircraft}</span>
                              )}
                              {scheme.period && (
                                <span className="ml-1">({scheme.period})</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {(scheme.colorCodes && scheme.colorCodes.length > 0
                              ? scheme.colorCodes.slice(0, 6)
                              : scheme.fsCodes
                                  .slice(0, 6)
                                  .map((fs) => ({
                                    type: "FS" as const,
                                    code: fs,
                                  }))
                            ).map((color, i) => {
                              const enriched = enrichColorCode(
                                color as ColorCode,
                              );
                              return (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded border text-[8px] flex items-center justify-center"
                                  style={{
                                    backgroundColor:
                                      enriched.hexColor || undefined,
                                  }}
                                  title={`${enriched.type} ${enriched.code}${enriched.name ? ` - ${enriched.name}` : ""}`}
                                >
                                  {!enriched.hexColor &&
                                    (enriched.type === "FS"
                                      ? "FS"
                                      : enriched.type === "RLM"
                                        ? "R"
                                        : enriched.type === "RAL"
                                          ? "L"
                                          : enriched.type === "ANA"
                                            ? "A"
                                            : "?")}
                                </div>
                              );
                            })}
                            {(scheme.colorCodes?.length ||
                              scheme.fsCodes.length) > 6 && (
                              <span className="text-xs text-muted-foreground">
                                +
                                {(scheme.colorCodes?.length ||
                                  scheme.fsCodes.length) - 6}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {t("kitDetail.schemeSelector.noSchemes")}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedScheme(null)}
                    data-testid="button-back-schemes"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t("common.back")}
                  </Button>
                  <div className="flex-1">
                    <p className="font-medium">{selectedScheme.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedScheme.category && (
                        <Badge variant="outline" className="mr-1">
                          {selectedScheme.category}
                        </Badge>
                      )}
                      {selectedScheme.aircraft}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("kitDetail.schemeSelector.selectBrandForColor")}
                </p>
                <div className="max-h-[45vh] overflow-y-auto space-y-3">
                  {getSchemeColors(selectedScheme).map(
                    (colorCode, colorIndex) => {
                      const enriched = enrichColorCode(colorCode);
                      const colorKey = `${enriched.type}-${enriched.code}`;
                      const matchingPaints = getMatchingPaintsForCode(enriched);
                      const selection = schemeBrandSelections[colorKey];

                      return (
                        <div
                          key={colorKey}
                          className="p-3 rounded-md border bg-muted/30"
                          data-testid={`color-row-${colorIndex}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-6 h-6 rounded border flex items-center justify-center text-xs font-mono"
                              style={{
                                backgroundColor: enriched.hexColor || undefined,
                              }}
                            >
                              {!enriched.hexColor &&
                                (enriched.type === "FS"
                                  ? "FS"
                                  : enriched.type === "RLM"
                                    ? "R"
                                    : enriched.type === "RAL"
                                      ? "L"
                                      : enriched.type === "ANA"
                                        ? "A"
                                        : "?")}
                            </div>
                            <span className="font-medium">
                              {enriched.type} {enriched.code}
                            </span>
                            {enriched.name && (
                              <span className="text-sm text-muted-foreground">
                                - {enriched.name}
                              </span>
                            )}
                            {selection && (
                              <Badge variant="secondary" className="ml-auto">
                                {selection.brand} - {selection.code}
                              </Badge>
                            )}
                          </div>
                          {matchingPaints.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {matchingPaints.slice(0, 8).map((match, idx) => (
                                <div
                                  key={`${match.brand}-${match.paint.code}-${idx}`}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                    selection?.brand === match.brand &&
                                      selection?.code === match.paint.code
                                      ? "bg-primary/20 border border-primary"
                                      : "bg-background hover:bg-muted",
                                  )}
                                  onClick={() => {
                                    setSchemeBrandSelections((prev) => ({
                                      ...prev,
                                      [colorKey]: {
                                        brand: match.brand,
                                        code: match.paint.code,
                                        name: match.paint.name,
                                        color: match.paint.color,
                                      },
                                    }));
                                  }}
                                  data-testid={`paint-option-${colorIndex}-${idx}`}
                                >
                                  {match.paint.color && (
                                    <div
                                      className="w-4 h-4 rounded-sm border flex-shrink-0"
                                      style={{
                                        backgroundColor: match.paint.color,
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">
                                      {match.brand}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {match.paint.code} - {match.paint.name}
                                    </p>
                                  </div>
                                  {selection?.brand === match.brand &&
                                    selection?.code === match.paint.code && (
                                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                    )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              {t("kitDetail.paints.noCodeFound")}
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSchemeDialogOpen(false)}
              data-testid="button-cancel-scheme"
            >
              {t("kitDetail.schemeSelector.cancel")}
            </Button>
            <Button
              onClick={handleApplyScheme}
              disabled={!selectedScheme}
              data-testid="button-apply-scheme"
            >
              <Check className="w-4 h-4 mr-1" />
              {t("kitDetail.schemeSelector.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paintDialogOpen}
        onOpenChange={(open) => {
          setPaintDialogOpen(open);
          if (!open) {
            setFsSearchTerm("");
            setFsSearchResults([]);
          }
        }}
      >
        <DialogContent className="max-w-md" data-testid="paint-dialog">
          <DialogHeader>
            <DialogTitle>{t("kitDetail.paints.addPaint")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 p-3 rounded-md bg-muted/50 border border-dashed">
              <Label className="text-sm font-medium">
                {t("kitDetail.paints.searchByFs")}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={fsSearchTerm}
                  onChange={(e) => handleFsSearch(e.target.value)}
                  placeholder="Digite o codigo FS (ex: 34087)"
                  data-testid="input-fs-search"
                />
                {fsSearchTerm.length >= 3 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveFsCodeOnly}
                    data-testid="button-save-fs-only"
                  >
                    {t("common.save")}
                  </Button>
                )}
              </div>
              {fsSearchResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs text-muted-foreground">
                    {t("kitDetail.paints.paintsFound", {
                      count: fsSearchResults.length,
                    })}
                    :
                  </p>
                  {fsSearchResults.map((result, idx) => (
                    <div
                      key={`${result.brand}-${result.paint.code}-${idx}`}
                      className="flex items-center gap-2 p-2 rounded-md bg-background cursor-pointer hover-elevate"
                      onClick={() => handleSelectFsSuggestion(result)}
                      data-testid={`fs-suggestion-${idx}`}
                    >
                      {result.paint.color && (
                        <div
                          className="w-5 h-5 rounded-sm border flex-shrink-0"
                          style={{ backgroundColor: result.paint.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.paint.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.brand} - {result.paint.code}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {fsSearchTerm.length >= 3 && fsSearchResults.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("kitDetail.paints.noFsFound")}
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("common.orFillManually")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("kitDetail.paints.brand")}</Label>
                <Popover
                  open={brandPopoverOpen}
                  onOpenChange={setBrandPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={brandPopoverOpen}
                      className="w-full justify-between font-normal"
                      data-testid="input-paint-brand"
                    >
                      {newPaint.brand || t("kitDetail.paints.select")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder={t("kitDetail.paints.searchBrand")}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {t("kitDetail.paints.noBrandFound")}
                        </CommandEmpty>
                        <CommandGroup>
                          {getBrandsWithCodes().map((brand) => (
                            <CommandItem
                              key={brand}
                              value={brand}
                              onSelect={() => {
                                setNewPaint({ ...newPaint, brand });
                                setBrandPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newPaint.brand === brand
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {brand}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paint-code">{t("kitDetail.paints.code")}</Label>
                {getPaintCodesForBrand(newPaint.brand || "").length > 0 ? (
                  <Popover
                    open={codePopoverOpen}
                    onOpenChange={setCodePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                        data-testid="input-paint-code"
                      >
                        {newPaint.code || t("kitDetail.paints.select")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          placeholder={t("kitDetail.paints.searchCode")}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("kitDetail.paints.noCodeFound")}
                          </CommandEmpty>
                          <CommandGroup>
                            {getPaintCodesForBrand(newPaint.brand || "").map(
                              (paintCode) => (
                                <CommandItem
                                  key={paintCode.code}
                                  value={`${paintCode.code} ${paintCode.name} ${paintCode.fsCode || ""} ${paintCode.rlmCode || ""}`}
                                  onSelect={() => {
                                    const matchingFs = paintCode.fsCode
                                      ? { code: paintCode.fsCode }
                                      : findMatchingFSCode(
                                          paintCode.color || "",
                                        );
                                    setNewPaint({
                                      ...newPaint,
                                      code: paintCode.code,
                                      name: paintCode.name,
                                      color: paintCode.color || newPaint.color,
                                      fsCode:
                                        matchingFs?.code || newPaint.fsCode,
                                      rlmCode:
                                        paintCode.rlmCode || newPaint.rlmCode,
                                    });
                                    setCodePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newPaint.code === paintCode.code
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {paintCode.color && (
                                    <div
                                      className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                      style={{
                                        backgroundColor: paintCode.color,
                                      }}
                                    />
                                  )}
                                  <span className="font-mono mr-2">
                                    {paintCode.code}
                                  </span>
                                  <span className="text-muted-foreground truncate flex-1">
                                    {paintCode.name}
                                  </span>
                                  {paintCode.fsCode && (
                                    <span className="text-xs text-primary ml-1">
                                      FS{paintCode.fsCode}
                                    </span>
                                  )}
                                  {paintCode.rlmCode && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      RLM{paintCode.rlmCode}
                                    </span>
                                  )}
                                </CommandItem>
                              ),
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    id="paint-code"
                    value={newPaint.code || ""}
                    onChange={(e) =>
                      setNewPaint({ ...newPaint, code: e.target.value })
                    }
                    placeholder="Ex: XF-1"
                    data-testid="input-paint-code"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paint-name">{t("kitDetail.paints.name")}</Label>
              <Popover
                open={namePopoverOpen}
                onOpenChange={setNamePopoverOpen}
                modal={false}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="paint-name"
                      value={newPaint.name || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPaint({ ...newPaint, name: value });
                        if (nameSearchTimeoutRef.current) {
                          clearTimeout(nameSearchTimeoutRef.current);
                        }
                        if (value.length >= 1) {
                          nameSearchTimeoutRef.current = setTimeout(() => {
                            const codeResults = findPaintsByName(value);
                            const conversionResults =
                              findPaintsFromConversionsByName(value);
                            const seen = new Set<string>();
                            const normalizeKey = (
                              brand: string,
                              code: string,
                            ) =>
                              `${brand.toLowerCase().trim()}-${code
                                .toUpperCase()
                                .replace(/[\s\-]/g, "")
                                .trim()}`;
                            const mergedResults = [
                              ...codeResults,
                              ...conversionResults,
                            ].filter((r) => {
                              const key = normalizeKey(r.brand, r.paint.code);
                              if (seen.has(key)) return false;
                              seen.add(key);
                              return true;
                            });
                            setNameSearchResults(mergedResults.slice(0, 50));
                            setNamePopoverOpen(mergedResults.length > 0);
                          }, 800);
                        } else {
                          setNameSearchResults([]);
                          setNamePopoverOpen(false);
                        }
                      }}
                      placeholder="Ex: Flat Black"
                      data-testid="input-paint-name"
                    />
                  </div>
                </PopoverTrigger>
                {nameSearchResults.length > 0 && (
                  <PopoverContent
                    className="w-[350px] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command>
                      <CommandList>
                        <CommandGroup
                          heading={`${nameSearchResults.length} cores encontradas`}
                        >
                          {nameSearchResults.map((result, index) => (
                            <CommandItem
                              key={`${result.brand}-${result.paint.code}-${index}`}
                              value={`${result.paint.name} ${result.paint.code} ${result.brand}`}
                              onSelect={() => {
                                setNewPaint({
                                  ...newPaint,
                                  brand: result.brand,
                                  code: result.paint.code,
                                  name: result.paint.name,
                                  color: result.paint.color || newPaint.color,
                                  fsCode:
                                    result.paint.fsCode || newPaint.fsCode,
                                });
                                setNamePopoverOpen(false);
                              }}
                            >
                              {result.paint.color && (
                                <div
                                  className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                  style={{
                                    backgroundColor: result.paint.color,
                                  }}
                                />
                              )}
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">
                                  {result.paint.name}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {result.brand} - {result.paint.code}
                                  {result.paint.fsCode &&
                                    ` (FS ${result.paint.fsCode})`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paint-fs">{t("kitDetail.paints.fsCode")}</Label>
                <Popover open={fsPopoverOpen} onOpenChange={setFsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                      data-testid="input-paint-fs"
                    >
                      {newPaint.fsCode || t("kitDetail.paints.select")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput
                        placeholder={t("kitDetail.paints.searchFs")}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {t("kitDetail.paints.noFsFound")}
                        </CommandEmpty>
                        <CommandGroup>
                          {FS_CODES.map((fs) => (
                            <CommandItem
                              key={fs.code}
                              value={`${fs.code} ${fs.name}`}
                              onSelect={() => {
                                setNewPaint({
                                  ...newPaint,
                                  fsCode: fs.code,
                                  color: newPaint.color || fs.color,
                                });
                                setFsPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newPaint.fsCode === fs.code
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div
                                className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                style={{ backgroundColor: fs.color }}
                              />
                              <span className="font-mono mr-2">{fs.code}</span>
                              <span className="text-muted-foreground text-sm truncate">
                                {fs.name}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paint-rlm">
                  {t("kitDetail.paints.rlmCode")}
                </Label>
                <Popover
                  open={rlmPopoverOpen}
                  onOpenChange={setRlmPopoverOpen}
                  modal={false}
                >
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        id="paint-rlm"
                        value={rlmSearchTerm || newPaint.rlmCode || ""}
                        onChange={(e) => {
                          handleRlmSearch(e.target.value);
                          if (!e.target.value) {
                            setNewPaint({ ...newPaint, rlmCode: undefined });
                          }
                        }}
                        onFocus={() =>
                          rlmSearchResults.length > 0 && setRlmPopoverOpen(true)
                        }
                        placeholder="Ex: 02, 66, 70..."
                        data-testid="input-paint-rlm"
                      />
                    </div>
                  </PopoverTrigger>
                  {rlmSearchResults.length > 0 && (
                    <PopoverContent
                      className="w-[350px] p-0"
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Command>
                        <CommandList>
                          <CommandGroup
                            heading={t("kitDetail.paints.paintsFound", {
                              count: rlmSearchResults.length,
                            })}
                          >
                            {rlmSearchResults
                              .slice(0, 50)
                              .map((result, idx) => (
                                <CommandItem
                                  key={`${result.brand}-${result.paint.code}-${idx}`}
                                  value={`${result.brand} ${result.paint.code} ${result.paint.name}`}
                                  onSelect={() =>
                                    handleSelectRlmSuggestion(result)
                                  }
                                >
                                  <div
                                    className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        result.paint.color || "#808080",
                                    }}
                                  />
                                  <span className="font-medium mr-2">
                                    {result.brand}
                                  </span>
                                  <span className="font-mono mr-2">
                                    {result.paint.code}
                                  </span>
                                  <span className="text-muted-foreground text-sm truncate">
                                    {result.paint.name}
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paint-ral">{t("kitDetail.paints.ralCode")}</Label>
              <Popover
                open={ralPopoverOpen}
                onOpenChange={setRalPopoverOpen}
                modal={false}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="paint-ral"
                      value={ralSearchTerm || newPaint.ralCode || ""}
                      onChange={(e) => {
                        handleRalSearch(e.target.value);
                        if (!e.target.value) {
                          setNewPaint({ ...newPaint, ralCode: undefined });
                        }
                      }}
                      onFocus={() =>
                        ralSearchResults.length > 0 && setRalPopoverOpen(true)
                      }
                      placeholder="Ex: 1002, 7012, 8020..."
                      data-testid="input-paint-ral"
                    />
                  </div>
                </PopoverTrigger>
                {ralSearchResults.length > 0 && (
                  <PopoverContent
                    className="w-[350px] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Command>
                      <CommandList>
                        <CommandGroup
                          heading={t("kitDetail.paints.paintsFound", {
                            count: ralSearchResults.length,
                          })}
                        >
                          {ralSearchResults.slice(0, 50).map((result, idx) => (
                            <CommandItem
                              key={`${result.brand}-${result.paint.code}-${idx}`}
                              value={`${result.brand} ${result.paint.code} ${result.paint.name}`}
                              onSelect={() => handleSelectRalSuggestion(result)}
                            >
                              <div
                                className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    result.paint.color || "#808080",
                                }}
                              />
                              <span className="font-medium mr-2">
                                {result.brand}
                              </span>
                              <span className="font-mono mr-2">
                                {result.paint.code}
                              </span>
                              <span className="text-muted-foreground text-sm truncate">
                                {result.paint.name}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paint-color">{t("kitDetail.paints.color")}</Label>
              <div className="flex gap-3 items-center">
                <div
                  className="w-16 h-16 rounded-md border-2 flex-shrink-0"
                  style={{ backgroundColor: newPaint.color || "#808080" }}
                  data-testid="paint-color-preview"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="paint-color"
                      type="color"
                      value={newPaint.color || "#808080"}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, color: e.target.value })
                      }
                      className="w-12 h-9 p-1"
                      data-testid="input-paint-color"
                    />
                    <Input
                      value={newPaint.color || ""}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, color: e.target.value })
                      }
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("kitDetail.paints.chooseColorManually")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaintDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="secondary"
              onClick={handleAddPaint}
              data-testid="button-save-paint"
            >
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={boxImageDialogOpen} onOpenChange={setBoxImageDialogOpen}>
        <DialogContent className="max-w-md" data-testid="box-image-dialog">
          <DialogHeader>
            <DialogTitle>{t("kitDetail.boxImage.addTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="box-image-url">
                {t("kitDetail.boxImage.imageUrl")}
              </Label>
              <Input
                id="box-image-url"
                value={boxImageUrl}
                onChange={(e) => setBoxImageUrl(e.target.value)}
                placeholder={t("kitDetail.boxImage.urlPlaceholder")}
                data-testid="input-box-image-url"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBoxImageDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="secondary"
              onClick={handleBoxImageUrl}
              data-testid="button-save-box-image-url"
            >
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Modal */}
      <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/95 border-none"
          data-testid="photo-gallery-modal"
        >
          <div className="relative flex flex-col items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setPhotoGalleryOpen(false)}
              data-testid="button-close-gallery"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh] w-full px-4 pt-4 pb-2">
              {kit.referencePhotos && kit.referencePhotos[currentPhotoIndex] && (
                <img
                  src={kit.referencePhotos[currentPhotoIndex].url}
                  alt={kit.referencePhotos[currentPhotoIndex].name}
                  className="max-w-full max-h-[75vh] object-contain"
                  data-testid="img-gallery-current"
                />
              )}
            </div>

            {(kit.referencePhotos || []).length > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handlePrevPhoto}
                  data-testid="button-prev-photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm tabular-nums">
                  {currentPhotoIndex + 1} / {(kit.referencePhotos || []).length}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleNextPhoto}
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Build Photo Gallery Modal */}
      <Dialog
        open={buildPhotoGalleryOpen}
        onOpenChange={setBuildPhotoGalleryOpen}
      >
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/95 border-none"
          data-testid="build-photo-gallery-modal"
        >
          <div className="relative flex flex-col items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setBuildPhotoGalleryOpen(false)}
              data-testid="button-close-build-gallery"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh] w-full px-4 pt-4 pb-2">
              {kit.buildPhotos && kit.buildPhotos[currentBuildPhotoIndex] && (
                <img
                  src={kit.buildPhotos[currentBuildPhotoIndex].url}
                  alt={kit.buildPhotos[currentBuildPhotoIndex].name}
                  className="max-w-full max-h-[75vh] object-contain"
                  data-testid="img-build-gallery-current"
                />
              )}
            </div>

            {(kit.buildPhotos || []).length > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handlePrevBuildPhoto}
                  data-testid="button-prev-build-photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm tabular-nums">
                  {currentBuildPhotoIndex + 1} / {(kit.buildPhotos || []).length}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleNextBuildPhoto}
                  data-testid="button-next-build-photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <Dialog
        open={pdfViewerOpen}
        onOpenChange={(open) => {
          if (!open && currentPdf?.url.startsWith("blob:")) {
            URL.revokeObjectURL(currentPdf.url);
          }
          setPdfViewerOpen(open);
        }}
      >
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-[90vw] h-[90vh] p-0"
          data-testid="pdf-viewer-modal"
        >
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="truncate flex-1">
                {currentPdf?.name}
              </DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    currentPdf && window.open(currentPdf.url, "_blank")
                  }
                  title={t("kitDetail.documents.openInNewTab")}
                  data-testid="button-open-pdf-new-tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPdfViewerOpen(false)}
                  data-testid="button-close-pdf"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 h-[calc(90vh-60px)]">
            {currentPdf && (
              <object
                data={currentPdf.url}
                type="application/pdf"
                className="w-full h-full border-0"
                title={currentPdf.name}
                data-testid="object-pdf-viewer"
              >
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    {t("kitDetail.documents.browserNotSupported")}
                  </p>
                  <Button onClick={() => window.open(currentPdf.url, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t("kitDetail.documents.openInNewTab")}
                  </Button>
                </div>
              </object>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketplace Search Dialog */}
      <Dialog
        open={marketplaceDialogOpen}
        onOpenChange={setMarketplaceDialogOpen}
      >
        <DialogContent className="max-w-md" data-testid="marketplace-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              {t("kitDetail.marketplace.title")}
            </DialogTitle>
          </DialogHeader>
          {selectedPaintForSearch && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  {selectedPaintForSearch.color && (
                    <div
                      className="w-6 h-6 rounded-md border"
                      style={{ backgroundColor: selectedPaintForSearch.color }}
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedPaintForSearch.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPaintForSearch.brand}{" "}
                      {selectedPaintForSearch.code &&
                        `- ${selectedPaintForSearch.code}`}
                    </p>
                  </div>
                </div>
              </div>

              {marketplaceLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <p className="text-muted-foreground">
                    {t("kitDetail.marketplace.searching")}
                  </p>
                </div>
              ) : marketplaceResults ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("kitDetail.marketplace.description")}
                  </p>
                  {marketplaceResults.tips && (
                    <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-md">
                      {marketplaceResults.tips}
                    </p>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t("kitDetail.marketplace.searchLinks")}
                    </p>
                    {marketplaceResults.searchLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                        data-testid={`marketplace-link-${index}`}
                      >
                        <ShoppingCart className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="flex-1 text-sm truncate">
                          {link.query}
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {t("kitDetail.marketplace.noResults")}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarketplaceDialogOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copilot Dialog */}
      <Dialog open={copilotDialogOpen} onOpenChange={setCopilotDialogOpen}>
        <DialogContent
          className="max-w-lg max-h-[85vh] overflow-y-auto"
          data-testid="copilot-dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              {t("kitDetail.copilot.title")}
            </DialogTitle>
          </DialogHeader>

          {copilotLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                {t("kitDetail.copilot.analyzing")}
              </p>
            </div>
          ) : copilotResults ? (
            <div className="space-y-6">
              {/* Checklist */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-accent" />
                  {t("kitDetail.copilot.projectChecklist")}
                </h3>
                <div className="space-y-2">
                  {copilotResults.checklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${item.done ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span
                        className={
                          item.done ? "line-through text-muted-foreground" : ""
                        }
                      >
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tempo Estimado */}
              <div className="p-4 rounded-md bg-accent/10 border border-accent/20">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-accent" />
                  {t("kitDetail.copilot.estimatedTime")}
                </h3>
                <p className="text-lg font-semibold">
                  {copilotResults.estimatedTime}
                </p>
              </div>

              {/* Riscos */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  {t("kitDetail.copilot.risksTitle")}
                </h3>
                <div className="space-y-2">
                  {copilotResults.risks.map((risk, index) => (
                    <div
                      key={index}
                      className="p-2 rounded-md bg-destructive/10 text-sm"
                    >
                      {risk}
                    </div>
                  ))}
                </div>
              </div>

              {/* Materiais */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-secondary" />
                  {t("kitDetail.copilot.materialsTitle")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {copilotResults.materials.map((material, index) => (
                    <Badge key={index} variant="secondary">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Dicas */}
              {copilotResults.tips && (
                <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t("kitDetail.copilot.tipsTitle")}
                  </h3>
                  <p className="text-sm">{copilotResults.tips}</p>
                </div>
              )}

              {/* Last free use message */}
              {copilotResults.isLastFreeUse && (
                <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t("kitDetail.copilot.lastFreeUseMessage")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("common.errorTryAgain")}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCopilotDialogOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CopilotUpgradeModal
        open={copilotUpgradeOpen}
        onOpenChange={setCopilotUpgradeOpen}
      />

      {/* Photo Analysis Dialog */}
      <Dialog
        open={photoAnalysisDialogOpen}
        onOpenChange={setPhotoAnalysisDialogOpen}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-testid="photo-analysis-dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent" />
              {t("kitDetail.photoAnalysis.title")}
            </DialogTitle>
          </DialogHeader>

          {selectedPhotoForAnalysis && (
            <div className="mb-4">
              <img
                src={selectedPhotoForAnalysis}
                alt={t("kitDetail.photoAnalysis.title")}
                className="w-full max-h-48 object-contain rounded-md bg-muted"
              />
            </div>
          )}

          {photoAnalysisLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <p className="text-muted-foreground text-center">
                {t("kitDetail.photoAnalysis.analyzing")}
              </p>
            </div>
          ) : photoAnalysisResults ? (
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div className="p-4 rounded-md bg-accent/10 border border-accent/20">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  {t("kitDetail.photoAnalysis.overallAssessment")}
                </h3>
                <p className="text-sm">
                  {photoAnalysisResults.overallAssessment}
                </p>
              </div>

              {/* Issues Found */}
              {photoAnalysisResults.issues.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium">
                    {t("kitDetail.photoAnalysis.issue")}:
                  </h3>
                  {photoAnalysisResults.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="p-3 bg-muted/50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                          <span className="font-medium">{issue.type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {issue.description}
                        </p>
                      </div>
                      <div className="p-3 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                            <WrenchIcon className="w-3 h-3" />
                            {t("kitDetail.photoAnalysis.howToFix")}:
                          </div>
                          <p className="text-sm pl-5">{issue.howToFix}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-accent mb-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t("kitDetail.photoAnalysis.howToPrevent")}:
                          </div>
                          <p className="text-sm pl-5">{issue.howToPrevent}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-md bg-primary/10 border border-primary/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">
                    {t("kitDetail.photoAnalysis.noIssues")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("common.errorTryAgain")}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPhotoAnalysisDialogOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Selection Dialog */}
      <Dialog
        open={photoSelectionDialogOpen}
        onOpenChange={setPhotoSelectionDialogOpen}
      >
        <DialogContent
          className="max-w-lg"
          data-testid="photo-selection-dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent" />
              {t("kitDetail.photoAnalysis.selectPhoto")}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-4">
            {t("kitDetail.photoAnalysis.selectPhoto")}
          </p>

          {(kit?.buildPhotos || []).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {kit?.buildPhotos?.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-video cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-accent transition-colors"
                  onClick={() => {
                    setPhotoSelectionDialogOpen(false);
                    handlePhotoAnalysis(photo.url);
                  }}
                  data-testid={`select-photo-${photo.id}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("kitDetail.photoAnalysis.noPhotos")}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPhotoSelectionDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KitForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kit={kit}
        onSave={handleSaveKit}
        isSaving={isSavingKit}
      />

      <UploadLoadingModal open={isUploading} message={uploadMessage} />
    </div>
  );
}
