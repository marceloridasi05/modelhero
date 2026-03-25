import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Paintbrush, Package, Wrench, Star, Search, Edit, Trash2, AlertTriangle, Camera, Loader2, ChevronLeft, ChevronRight, Download, ShoppingCart, Sparkles, ExternalLink, ArrowUpAZ, Clock, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import type { Material, InsertMaterial } from "@shared/schema";
import { findReferenceCode, findPaintsFromConversionsByName } from "@/lib/paintConversions";
import { findPaintsByName } from "@/lib/paintCodes";
import ShareButton from "@/components/ShareButton";

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

const MATERIAL_TYPES = [
  { value: "tintas", label: "Tintas", icon: Paintbrush },
  { value: "insumos", label: "Insumos", icon: Package },
  { value: "ferramentas", label: "Ferramentas", icon: Wrench },
  { value: "decais", label: "Decais", icon: Star },
] as const;

const PAINT_TYPES = ["acrilica", "esmalte", "laca"] as const;
const PAINT_FINISHES = ["fosco", "satin", "brilho", "metalico"] as const;
const TOOL_STATES = ["ok", "precisa_manutencao", "trocar"] as const;
const UNITS = ["frascos", "ml", "g", "unidades", "folhas"] as const;

const SUPPLY_TYPES = [
  "primer", "putty", "lixas", "fitas", "mascaras", "laminas", 
  "cola", "thinner", "diluente", "verniz_fosco", "verniz_satin", 
  "verniz_brilho", "decal_softener"
];

const TOOL_TYPES = ["estiletes", "aerografo", "compressores", "pinceis"];

const toTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const emptyFormData: Partial<InsertMaterial> = {
  name: "",
  type: "tintas",
  category: "",
  brand: "",
  unit: "frascos",
  currentQuantity: 0,
  minQuantity: 0,
  paintLine: "",
  paintCode: "",
  paintColor: "",
  paintHexColor: "",
  paintReference: "",
  paintType: undefined,
  paintFinish: undefined,
  supplyType: "",
  toolType: "",
  toolState: "ok",
  toolLastMaintenance: undefined,
  decalScale: "",
  decalBrand: "",
  decalForKit: "",
  decalForUnit: "",
};

export default function Materials() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("tintas");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState<Partial<InsertMaterial>>(emptyFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [search, setSearch] = useState("");
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "alphabetical">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const lastLookupRef = useRef<string>("");
  const colorNameSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [colorNameSearchResults, setColorNameSearchResults] = useState<{ brand: string; paint: { code: string; name: string; color?: string; fsCode?: string } }[]>([]);
  const [colorNamePopoverOpen, setColorNamePopoverOpen] = useState(false);
  const brandSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [brandColorSuggestions, setBrandColorSuggestions] = useState<{ name: string; code: string; hexColor: string }[]>([]);
  const [brandColorPopoverOpen, setBrandColorPopoverOpen] = useState(false);
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceResults, setMarketplaceResults] = useState<{
    searchLinks: { query: string; url: string }[];
    category: string;
    tips: string;
  } | null>(null);
  const [selectedMaterialForSearch, setSelectedMaterialForSearch] = useState<Material | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isExtractingFromUrl, setIsExtractingFromUrl] = useState(false);

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertMaterial>) => {
      const response = await apiRequest("POST", "/api/materials", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "LIMIT_EXCEEDED") {
          throw new Error("LIMIT_EXCEEDED");
        }
        throw new Error(errorData.message || t("materials.toasts.errorCreating"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification"] });
      toast({ title: t("materials.toasts.materialCreated") });
      handleCloseForm();
    },
    onError: (error: Error) => {
      if (error.message === "LIMIT_EXCEEDED") {
        setUpgradeModalOpen(true);
        return;
      }
      toast({ title: t("materials.toasts.errorCreating"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertMaterial> }) => {
      const response = await apiRequest("PATCH", `/api/materials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: t("materials.toasts.materialUpdated") });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({ title: t("materials.toasts.errorUpdating"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/materials/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification"] });
      toast({ title: t("materials.toasts.materialDeleted") });
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: t("materials.toasts.errorDeleting"), description: error.message, variant: "destructive" });
    },
  });

  const uniqueBrands = useMemo(() => {
    const paints = materials.filter(m => m.type === "tintas");
    const brands = new Set(paints.map(p => p.brand).filter(Boolean));
    return Array.from(brands).sort() as string[];
  }, [materials]);

  const uniqueColors = useMemo(() => {
    const paints = materials.filter(m => m.type === "tintas");
    const colors = new Set(paints.map(p => toTitleCase(p.paintColor || "")).filter(Boolean));
    return Array.from(colors).sort() as string[];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    let tabMaterials = materials.filter(m => m.type === activeTab);
    
    // Sort based on sortOrder
    if (sortOrder === "alphabetical") {
      tabMaterials = [...tabMaterials].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      });
    } else {
      // Sort by createdAt descending (newest first)
      tabMaterials = [...tabMaterials].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    
    // Apply brand filter for paints
    if (activeTab === "tintas" && brandFilter !== "all") {
      tabMaterials = tabMaterials.filter(m => m.brand === brandFilter);
    }
    
    // Apply color filter for paints
    if (activeTab === "tintas" && colorFilter !== "all") {
      tabMaterials = tabMaterials.filter(m => toTitleCase(m.paintColor || "") === colorFilter);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tabMaterials = tabMaterials.filter(m =>
        (m.name || "").toLowerCase().includes(searchLower) ||
        (m.brand || "").toLowerCase().includes(searchLower) ||
        (m.category || "").toLowerCase().includes(searchLower) ||
        (m.paintCode || "").toLowerCase().includes(searchLower) ||
        (m.paintReference || "").toLowerCase().includes(searchLower) ||
        (m.paintColor || "").toLowerCase().includes(searchLower)
      );
    }
    
    return tabMaterials;
  }, [materials, activeTab, search, brandFilter, colorFilter, sortOrder]);

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMaterials.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMaterials, currentPage]);

  const lowStockCount = useMemo(() => {
    return materials.filter(m => m.currentQuantity <= m.minQuantity).length;
  }, [materials]);

  const paintStats = useMemo(() => {
    const paints = materials.filter(m => m.type === "tintas");
    const total = paints.length;
    const withFS = paints.filter(p => (p.paintReference || "").toUpperCase().includes("FS")).length;
    const withRAL = paints.filter(p => (p.paintReference || "").toUpperCase().includes("RAL")).length;
    const withRLM = paints.filter(p => (p.paintReference || "").toUpperCase().includes("RLM")).length;
    return { total, withFS, withRAL, withRLM };
  }, [materials]);

  const handleDownloadCSV = () => {
    const typeLabels: Record<string, string> = {
      tintas: t("materials.tabs.paints"),
      insumos: t("materials.tabs.supplies"),
      ferramentas: t("materials.tabs.tools"),
      decais: t("materials.tabs.decals"),
    };
    const headers = [t("materials.form.name"), t("common.type"), t("materials.form.brand"), t("materials.form.line"), t("materials.form.code"), t("materials.form.hexColor"), t("materials.form.reference"), t("materials.form.currentQuantity"), t("materials.form.minQuantity"), t("materials.form.unit")];
    const rows = filteredMaterials.map(m => [
      m.name,
      typeLabels[m.type] || m.type,
      m.brand || "",
      m.paintLine || "",
      m.paintCode || "",
      m.paintHexColor || "",
      m.paintReference || "",
      m.currentQuantity.toString(),
      m.minQuantity.toString(),
      m.unit,
    ]);
    const footerRow = ["", "", "", "", "", "", "", "", "", ""];
    const footerTextRow = ["Documento gerado por ModelHero - modelhero.app", "", "", "", "", "", "", "", "", ""];
    const csv = [headers, ...rows, footerRow, footerTextRow].map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `materiais_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("materials.downloadStarted"), description: t("materials.materialsExported", { count: filteredMaterials.length }) });
  };

  const canAddMaterial = () => {
    return usage?.canAddItem ?? false;
  };

  const handleOpenForm = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        type: material.type,
        category: material.category || "",
        brand: material.brand || "",
        unit: material.unit,
        currentQuantity: material.currentQuantity,
        minQuantity: material.minQuantity,
        paintLine: material.paintLine || "",
        paintCode: material.paintCode || "",
        paintColor: material.paintColor || "",
        paintHexColor: material.paintHexColor || "",
        paintReference: material.paintReference || "",
        paintType: material.paintType || undefined,
        paintFinish: material.paintFinish || undefined,
        supplyType: material.supplyType || "",
        toolType: material.toolType || "",
        toolState: material.toolState || "ok",
        toolLastMaintenance: material.toolLastMaintenance || undefined,
        decalScale: material.decalScale || "",
        decalBrand: material.decalBrand || "",
        decalForKit: material.decalForKit || "",
        decalForUnit: material.decalForUnit || "",
      });
      setFormOpen(true);
    } else {
      if (!canAddMaterial()) {
        setUpgradeModalOpen(true);
        return;
      }
      setEditingMaterial(null);
      setFormData({ ...emptyFormData, type: activeTab });
      setFormOpen(true);
    }
  };

  const handlePhotoClick = () => {
    if (!canAddMaterial()) {
      setUpgradeModalOpen(true);
      return;
    }
    photoInputRef.current?.click();
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingMaterial(null);
    setFormData(emptyFormData);
    lastLookupRef.current = "";
    setBrandColorSuggestions([]);
    setBrandColorPopoverOpen(false);
    setUrlInput("");
  };

  const handleExtractFromUrl = async () => {
    if (!urlInput.trim()) return;
    
    setIsExtractingFromUrl(true);
    try {
      const response = await fetch("/api/ai/extract-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: urlInput.trim(), formType: "material" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.name) setFormData(prev => ({ ...prev, name: data.name }));
        if (data.brand) setFormData(prev => ({ ...prev, brand: data.brand }));
        if (data.type) setFormData(prev => ({ ...prev, type: data.type }));
        if (data.paintLine) setFormData(prev => ({ ...prev, paintLine: data.paintLine }));
        if (data.paintCode) setFormData(prev => ({ ...prev, paintCode: data.paintCode }));
        if (data.paintColor) setFormData(prev => ({ ...prev, paintColor: data.paintColor }));
        if (data.paintHexColor) setFormData(prev => ({ ...prev, paintHexColor: data.paintHexColor }));
        
        const fieldsFound = [
          data.name && `${t("materials.form.name")}: ${data.name}`,
          data.brand && `${t("materials.form.brand")}: ${data.brand}`,
          data.paintCode && `${t("materials.form.code")}: ${data.paintCode}`,
        ].filter(Boolean);
        
        toast({
          title: t("materials.toasts.dataExtracted"),
          description: fieldsFound.length > 0
            ? fieldsFound.join(", ")
            : t("materials.toasts.noDataFoundInUrl"),
        });
        setUrlInput("");
      } else {
        toast({
          title: t("materials.toasts.errorExtractingData"),
          description: t("materials.toasts.couldNotExtractFromUrl"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("materials.toasts.serverConnectionError"),
        variant: "destructive",
      });
    } finally {
      setIsExtractingFromUrl(false);
    }
  };

  const handleSearchMarketplace = async (material: Material) => {
    setSelectedMaterialForSearch(material);
    setMarketplaceDialogOpen(true);
    setMarketplaceLoading(true);
    setMarketplaceResults(null);

    try {
      const response = await fetch("/api/paint/search-marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: material.brand,
          code: material.paintCode,
          name: material.name,
          fsCode: material.paintReference,
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

  const lookupPaintByColorName = async (colorName: string) => {
    if (!colorName || colorName.trim().length < 2) return;
    
    try {
      const response = await fetch(`/api/materials/lookup-paint-by-color?colorName=${encodeURIComponent(colorName)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const existingPaint = await response.json();
        if (existingPaint && existingPaint.paintHexColor) {
          setFormData(prev => ({
            ...prev,
            paintHexColor: prev.paintHexColor || existingPaint.paintHexColor,
          }));
        }
      }
    } catch (error) {
      console.error("Error looking up paint by color:", error);
    }
  };

  const fetchBrandColors = async (brand: string) => {
    if (!brand || brand.trim().length < 2) {
      setBrandColorSuggestions([]);
      setBrandColorPopoverOpen(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/materials/paints-by-brand?brand=${encodeURIComponent(brand)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const paints = await response.json();
        const suggestions = paints.map((p: any) => ({
          name: p.paintColor || p.name,
          code: p.paintCode || '',
          hexColor: p.paintHexColor || ''
        })).filter((s: any) => s.name);
        setBrandColorSuggestions(suggestions);
        if (suggestions.length > 0) {
          setBrandColorPopoverOpen(true);
        }
      }
    } catch (error) {
      console.error("Error fetching brand colors:", error);
    }
  };

  const normalizeBrandName = (brand: string): string => {
    if (brand.toLowerCase() === "talento") {
      return "Talento";
    }
    return brand;
  };

  const lookupPaintReference = async (brand: string, code: string, colorName?: string) => {
    if (!brand && !code && !colorName) return;
    
    // First try to find from existing materials in database
    if (brand && code) {
      try {
        const response = await fetch(`/api/materials/lookup-paint?brand=${encodeURIComponent(brand)}&code=${encodeURIComponent(code)}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const existingPaint = await response.json();
          if (existingPaint) {
            setFormData(prev => ({
              ...prev,
              paintReference: prev.paintReference || existingPaint.paintReference || "",
              paintHexColor: prev.paintHexColor || existingPaint.paintHexColor || "",
              paintColor: prev.paintColor || existingPaint.paintColor || existingPaint.name || "",
              paintLine: prev.paintLine || existingPaint.paintLine || "",
              paintType: prev.paintType || existingPaint.paintType || undefined,
              paintFinish: prev.paintFinish || existingPaint.paintFinish || undefined,
            }));
            toast({ 
              title: t("materials.paintFound"), 
              description: t("materials.dataFilledFromExisting") 
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error looking up existing paint:", error);
      }
    }
    
    // Fall back to static paint conversions database
    const refLookup = findReferenceCode({
      brand: brand || undefined,
      manufacturerCode: code || undefined,
      colorName: colorName || undefined,
    });
    
    if (refLookup) {
      setFormData(prev => ({
        ...prev,
        paintReference: prev.paintReference || refLookup.code,
        paintHexColor: prev.paintHexColor || refLookup.hexColor || "",
        paintColor: prev.paintColor || refLookup.colorName || "",
      }));
    }
  };

  const lookupMaterial = async (type: string, name: string, brand?: string) => {
    if (!name || name.trim().length < 2) return;
    
    const lookupKey = `${type}:${name.toLowerCase().trim()}:${(brand || "").toLowerCase().trim()}`;
    if (lastLookupRef.current === lookupKey) return;
    
    try {
      let url = `/api/materials/lookup?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`;
      if (brand) {
        url += `&brand=${encodeURIComponent(brand)}`;
      }
      
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const existingMaterial = await response.json();
        if (existingMaterial) {
          lastLookupRef.current = lookupKey;
          
          const materialLabels: Record<string, string> = {
            insumos: t("materials.materialTypes.insumos"),
            ferramentas: t("materials.materialTypes.ferramentas"), 
            decais: t("materials.materialTypes.decais")
          };
          
          const isDefault = (field: keyof typeof emptyFormData, value: any) => {
            return value === emptyFormData[field] || !value;
          };
          
          setFormData(prev => {
            const updates: Partial<typeof prev> = {};
            
            if (isDefault("category", prev.category) && existingMaterial.category) {
              updates.category = existingMaterial.category;
            }
            if (isDefault("brand", prev.brand) && existingMaterial.brand) {
              updates.brand = existingMaterial.brand;
            }
            if ((prev.unit === "frascos" || prev.unit === emptyFormData.unit) && existingMaterial.unit) {
              updates.unit = existingMaterial.unit;
            }
            
            if (type === "insumos") {
              if (isDefault("supplyType", prev.supplyType) && existingMaterial.supplyType) {
                updates.supplyType = existingMaterial.supplyType;
              }
            } else if (type === "ferramentas") {
              if (isDefault("toolType", prev.toolType) && existingMaterial.toolType) {
                updates.toolType = existingMaterial.toolType;
              }
            } else if (type === "decais") {
              if (isDefault("decalScale", prev.decalScale) && existingMaterial.decalScale) {
                updates.decalScale = existingMaterial.decalScale;
              }
              if (isDefault("decalBrand", prev.decalBrand) && existingMaterial.decalBrand) {
                updates.decalBrand = existingMaterial.decalBrand;
              }
              if (isDefault("decalForKit", prev.decalForKit) && existingMaterial.decalForKit) {
                updates.decalForKit = existingMaterial.decalForKit;
              }
              if (isDefault("decalForUnit", prev.decalForUnit) && existingMaterial.decalForUnit) {
                updates.decalForUnit = existingMaterial.decalForUnit;
              }
            }
            
            if (Object.keys(updates).length === 0) {
              return prev;
            }
            
            return { ...prev, ...updates };
          });
          
          toast({ 
            title: `${materialLabels[type] || "Material"} ${t("materials.paintFound").split("!")[0]}!`, 
            description: t("materials.dataFilledFromMaterial") 
          });
        }
      }
    } catch (error) {
      console.error("Error looking up material:", error);
    }
  };

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canAddMaterial()) {
      setUpgradeModalOpen(true);
      event.target.value = "";
      return;
    }

    setIsAnalyzingPhoto(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          const response = await apiRequest("POST", "/api/ai/extract-paint-from-photo", {
            photoUrl: base64
          });
          const result = await response.json();
          
          if (result.paint) {
            const paint = result.paint;
            let reference = paint.fsCode || paint.ralCode || paint.rlmCode || "";
            let hexColor = paint.hexColor || "";
            let lookupColorName = "";
            
            const refLookup = findReferenceCode({
              brand: paint.brand,
              manufacturerCode: paint.manufacturerCode,
              colorName: paint.colorName,
              hexColor: paint.hexColor,
            });
            
            if (refLookup) {
              if (!reference) {
                reference = refLookup.code;
              }
              if (!hexColor && refLookup.hexColor) {
                hexColor = refLookup.hexColor;
              }
              if (!lookupColorName && refLookup.colorName) {
                lookupColorName = refLookup.colorName;
              }
            }
            
            setFormData({
              ...emptyFormData,
              type: "tintas",
              paintColor: paint.colorName || lookupColorName || "",
              brand: paint.brand || "",
              paintLine: paint.line || "",
              paintCode: paint.manufacturerCode || "",
              paintReference: reference,
              paintHexColor: hexColor,
              currentQuantity: 1,
            });
            setFormOpen(true);
            
            const description = reference 
              ? t("materials.toasts.codeFoundInDatabase", { code: reference })
              : (result.confidence > 0.7 
                ? t("materials.toasts.dataFilledAutomatically") 
                : t("materials.toasts.verifyIdentifiedData"));
            
            toast({ 
              title: t("materials.paintIdentified"), 
              description
            });
          } else {
            toast({ 
              title: t("materials.couldNotIdentify"), 
              description: t("materials.tryClearerPhoto"),
              variant: "destructive" 
            });
          }
        } catch (error) {
          console.error("Error analyzing paint:", error);
          toast({ 
            title: t("materials.analysisError"), 
            description: t("materials.couldNotAnalyzePhoto"),
            variant: "destructive" 
          });
        }
        
        setIsAnalyzingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsAnalyzingPhoto(false);
      toast({ 
        title: t("materials.errorReadingFile"), 
        variant: "destructive" 
      });
    }
    
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    const dataToSubmit = { ...formData };
    
    if (formData.type === "tintas") {
      if (!formData.paintColor) {
        toast({ title: t("materials.toasts.fillColorName"), variant: "destructive" });
        return;
      }
      dataToSubmit.name = formData.paintColor;
    } else {
      if (!formData.name || !formData.type) {
        toast({ title: t("materials.toasts.fillRequiredFields"), variant: "destructive" });
        return;
      }
    }

    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: dataToSubmit });
    } else {
      if (!canAddMaterial()) {
        handleCloseForm();
        setUpgradeModalOpen(true);
        return;
      }
      createMutation.mutate(dataToSubmit);
    }
  };

  const getStatusBadge = (material: Material) => {
    if (material.currentQuantity <= material.minQuantity) {
      return <Badge variant="destructive" className="text-xs">{t("materials.lowStock")}</Badge>;
    }
    return null;
  };

  const getToolStateBadge = (state: string | null) => {
    switch (state) {
      case "ok":
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t("materials.toolStates.ok")}</Badge>;
      case "precisa_manutencao":
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t("materials.toolStates.precisa_manutencao")}</Badge>;
      case "trocar":
        return <Badge variant="destructive" className="text-xs">{t("materials.toolStates.trocar")}</Badge>;
      default:
        return null;
    }
  };

  const renderPaintRow = (material: Material) => (
    <div 
      key={material.id} 
      className="flex items-center gap-3 p-3 border-b border-border hover-elevate"
      data-testid={`row-paint-${material.id}`}
    >
      <div 
        className="w-8 h-8 rounded-md border border-border flex-shrink-0"
        style={{ backgroundColor: material.paintHexColor || '#cccccc' }}
        title={material.paintHexColor || t('materials.noColorDefined')}
        data-testid={`color-chip-${material.id}`}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate" data-testid={`text-paint-name-${material.id}`}>
            {toTitleCase(material.name || "")}
          </span>
          {material.paintCode && (
            <span className="text-sm text-muted-foreground">({material.paintCode})</span>
          )}
          {material.paintType && (
            <Badge variant="outline" className="text-xs capitalize">{material.paintType}</Badge>
          )}
          {material.paintFinish && (
            <Badge variant="secondary" className="text-xs capitalize">{material.paintFinish}</Badge>
          )}
          {getStatusBadge(material)}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {material.brand && <span>{material.brand}</span>}
          {material.paintLine && <span>{material.paintLine}</span>}
          {material.paintReference && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{material.paintReference}</span>}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm flex-shrink-0">
        <span className={material.currentQuantity <= material.minQuantity ? "text-destructive font-medium" : ""}>
          {material.currentQuantity} {material.unit === "frascos" && material.currentQuantity <= 1 ? "frasco" : material.unit}
        </span>
      </div>
      
      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleSearchMarketplace(material)}
          title={t("materials.marketplace.searchInMarketplace")}
          data-testid={`button-search-marketplace-${material.id}`}
        >
          <ShoppingCart className="w-4 h-4 text-accent" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleOpenForm(material)}
          data-testid={`button-edit-paint-${material.id}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setMaterialToDelete(material);
            setDeleteDialogOpen(true);
          }}
          data-testid={`button-delete-paint-${material.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderMaterialCard = (material: Material) => (
    <Card key={material.id} className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium truncate" data-testid={`text-material-name-${material.id}`}>
                {material.name}
              </h3>
              {getStatusBadge(material)}
              {material.type === "ferramentas" && getToolStateBadge(material.toolState)}
            </div>
            
            <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
              {material.brand && <p>{t("materials.form.brand")}: {material.brand}</p>}
              {material.type === "insumos" && material.supplyType && (
                <p>{t("common.type")}: {t(`materials.supplyTypes.${material.supplyType}`)}</p>
              )}
              {material.type === "ferramentas" && material.toolType && (
                <p>{t("common.type")}: {t(`materials.toolTypes.${material.toolType}`)}</p>
              )}
              {material.type === "decais" && (
                <>
                  {material.decalScale && <p>{t("materials.form.scale")}: {material.decalScale}</p>}
                  {material.decalForKit && <p>{t("materials.form.targetKit")}: {material.decalForKit}</p>}
                </>
              )}
            </div>
            
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className={material.currentQuantity <= material.minQuantity ? "text-destructive font-medium" : ""}>
                {t("materials.form.currentQuantity")}: {material.currentQuantity} {material.unit === "frascos" && material.currentQuantity <= 1 ? t("materials.units.frasco") : t(`materials.units.${material.unit}`)}
              </span>
              <span className="text-muted-foreground">
                Min: {material.minQuantity} {material.unit === "frascos" && material.minQuantity <= 1 ? t("materials.units.frasco") : t(`materials.units.${material.unit}`)}
              </span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleOpenForm(material)}
              data-testid={`button-edit-material-${material.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setMaterialToDelete(material);
                setDeleteDialogOpen(true);
              }}
              data-testid={`button-delete-material-${material.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case "tintas":
        return (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>{t("materials.form.colorNameRequired")}</Label>
                <Popover open={colorNamePopoverOpen} onOpenChange={setColorNamePopoverOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        value={formData.paintColor || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, paintColor: value });
                          if (colorNameSearchTimeoutRef.current) {
                            clearTimeout(colorNameSearchTimeoutRef.current);
                          }
                          if (value.length >= 1) {
                            colorNameSearchTimeoutRef.current = setTimeout(() => {
                              const codeResults = findPaintsByName(value);
                              const conversionResults = findPaintsFromConversionsByName(value);
                              const seen = new Set<string>();
                              const normalizeKey = (brand: string, code: string) =>
                                `${brand.toLowerCase().trim()}-${code.toUpperCase().replace(/[\s\-]/g, '').trim()}`;
                              const mergedResults = [...codeResults, ...conversionResults].filter(r => {
                                const key = normalizeKey(r.brand, r.paint.code);
                                if (seen.has(key)) return false;
                                seen.add(key);
                                return true;
                              });
                              setColorNameSearchResults(mergedResults.slice(0, 50));
                              setColorNamePopoverOpen(mergedResults.length > 0);
                            }, 800);
                          } else {
                            setColorNameSearchResults([]);
                            setColorNamePopoverOpen(false);
                          }
                        }}
                        onBlur={async () => {
                          const titleCaseColor = toTitleCase(formData.paintColor || "");
                          if (titleCaseColor !== formData.paintColor) {
                            setFormData(prev => ({ ...prev, paintColor: titleCaseColor }));
                          }
                          if (titleCaseColor && !formData.paintHexColor) {
                            await lookupPaintByColorName(titleCaseColor);
                          }
                        }}
                        placeholder="Ex: Black"
                        data-testid="input-paint-color-name"
                      />
                    </div>
                  </PopoverTrigger>
                  {colorNameSearchResults.length > 0 && (
                    <PopoverContent className="w-[350px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Command>
                        <CommandList className="max-h-[200px] overflow-y-auto">
                          <CommandGroup heading={t("materials.colorsFound", { count: colorNameSearchResults.length })}>
                            {colorNameSearchResults.map((result, index) => (
                              <CommandItem
                                key={`${result.brand}-${result.paint.code}-${index}`}
                                value={`${result.paint.name} ${result.paint.code} ${result.brand}`}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    paintColor: toTitleCase(result.paint.name),
                                    brand: normalizeBrandName(result.brand),
                                    paintCode: result.paint.code,
                                    paintHexColor: result.paint.color || formData.paintHexColor,
                                    paintReference: result.paint.fsCode ? `FS ${result.paint.fsCode}` : formData.paintReference,
                                  });
                                  setColorNamePopoverOpen(false);
                                  lookupPaintByColorName(result.paint.name);
                                }}
                              >
                                {result.paint.color && (
                                  <div
                                    className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                    style={{ backgroundColor: result.paint.color }}
                                  />
                                )}
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium truncate">{result.paint.name}</span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {result.brand} - {result.paint.code}
                                    {result.paint.fsCode && ` (FS ${result.paint.fsCode})`}
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
              <div>
                <Label>{t("materials.form.hexColor")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formData.paintHexColor || "#cccccc"}
                    onChange={(e) => setFormData({ ...formData, paintHexColor: e.target.value })}
                    className="w-10 h-9 p-1 cursor-pointer"
                    data-testid="input-paint-hex-color"
                  />
                  <Input
                    value={formData.paintHexColor || ""}
                    onChange={(e) => setFormData({ ...formData, paintHexColor: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-paint-hex-text"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>{t("materials.form.brand")}</Label>
              <Popover open={brandColorPopoverOpen} onOpenChange={setBrandColorPopoverOpen} modal={false}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      value={formData.brand || ""}
                      onChange={(e) => {
                        const newBrand = normalizeBrandName(e.target.value);
                        setFormData({ ...formData, brand: newBrand });
                        if (brandSearchTimeoutRef.current) {
                          clearTimeout(brandSearchTimeoutRef.current);
                        }
                        brandSearchTimeoutRef.current = setTimeout(() => {
                          fetchBrandColors(newBrand);
                        }, 500);
                      }}
                      onBlur={async () => {
                        const normalizedBrand = normalizeBrandName(formData.brand || "");
                        if (normalizedBrand !== formData.brand) {
                          setFormData(prev => ({ ...prev, brand: normalizedBrand }));
                        }
                        await lookupPaintReference(normalizedBrand, formData.paintCode || "", formData.paintColor || "");
                      }}
                      placeholder={t("materials.form.brand")}
                      data-testid="input-material-brand"
                    />
                  </div>
                </PopoverTrigger>
                {brandColorSuggestions.length > 0 && (
                  <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Command>
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandGroup heading={t("materials.stats.colorsFromBrand", { count: brandColorSuggestions.length })}>
                          {brandColorSuggestions.map((suggestion, index) => (
                            <CommandItem
                              key={`${suggestion.name}-${suggestion.code}-${index}`}
                              value={`${suggestion.name} ${suggestion.code}`}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  paintColor: toTitleCase(suggestion.name),
                                  paintCode: suggestion.code,
                                  paintHexColor: suggestion.hexColor || formData.paintHexColor,
                                });
                                setBrandColorPopoverOpen(false);
                              }}
                            >
                              {suggestion.hexColor && (
                                <div
                                  className="w-4 h-4 rounded-sm border mr-2 flex-shrink-0"
                                  style={{ backgroundColor: suggestion.hexColor }}
                                />
                              )}
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">{suggestion.name}</span>
                                {suggestion.code && (
                                  <span className="text-xs text-muted-foreground truncate">{suggestion.code}</span>
                                )}
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
            <div>
              <Label>{t("materials.form.line")}</Label>
              <Input
                value={formData.paintLine || ""}
                onChange={(e) => setFormData({ ...formData, paintLine: e.target.value })}
                placeholder="Ex: Model Color"
                data-testid="input-paint-line"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("materials.form.reference")}</Label>
                <Input
                  value={formData.paintReference || ""}
                  onChange={(e) => setFormData({ ...formData, paintReference: e.target.value })}
                  placeholder="Ex: FS 36375"
                  data-testid="input-paint-reference"
                />
              </div>
              <div>
                <Label>{t("materials.form.manufacturerCode")}</Label>
                <Input
                  value={formData.paintCode || ""}
                  onChange={(e) => setFormData({ ...formData, paintCode: e.target.value })}
                  onBlur={async () => await lookupPaintReference(formData.brand || "", formData.paintCode || "", formData.paintColor || "")}
                  placeholder="Ex: 70.950"
                  data-testid="input-paint-code"
                />
              </div>
            </div>
            <div>
              <Label>{t("materials.form.paintType")}</Label>
              <Select
                value={formData.paintType || ""}
                onValueChange={(v) => setFormData({ ...formData, paintType: v as typeof PAINT_TYPES[number] })}
              >
                <SelectTrigger data-testid="select-paint-type">
                  <SelectValue placeholder={t("materials.form.select")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acrilica">{t("materials.paintTypes.acrilica")}</SelectItem>
                  <SelectItem value="esmalte">{t("materials.paintTypes.esmalte")}</SelectItem>
                  <SelectItem value="laca">{t("materials.paintTypes.laca")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("materials.form.finish")}</Label>
              <Select
                value={formData.paintFinish || ""}
                onValueChange={(v) => setFormData({ ...formData, paintFinish: v as typeof PAINT_FINISHES[number] })}
              >
                <SelectTrigger data-testid="select-paint-finish">
                  <SelectValue placeholder={t("materials.form.select")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fosco">{t("materials.finishes.fosco")}</SelectItem>
                  <SelectItem value="satin">{t("materials.finishes.satin")}</SelectItem>
                  <SelectItem value="brilho">{t("materials.finishes.brilho")}</SelectItem>
                  <SelectItem value="metalico">{t("materials.finishes.metalico")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t("materials.form.unit")}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v as typeof UNITS[number] })}
                >
                  <SelectTrigger data-testid="select-material-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{t(`materials.units.${unit}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("materials.form.currentQuantity")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.currentQuantity || 0}
                  onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })}
                  data-testid="input-material-current-quantity"
                />
              </div>
              <div>
                <Label>{t("materials.form.minQuantity")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minQuantity || 0}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                  data-testid="input-material-minimum-quantity"
                />
              </div>
            </div>
          </>
        );

      case "insumos":
        return (
          <div>
            <Label>{t("materials.form.supplyType")}</Label>
            <Select
              value={formData.supplyType || ""}
              onValueChange={(v) => setFormData({ ...formData, supplyType: v })}
            >
              <SelectTrigger data-testid="select-supply-type">
                <SelectValue placeholder={t("materials.form.selectType")} />
              </SelectTrigger>
              <SelectContent>
                {SUPPLY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`materials.supplyTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "ferramentas":
        return (
          <>
            <div>
              <Label>{t("materials.form.toolType")}</Label>
              <Select
                value={formData.toolType || ""}
                onValueChange={(v) => setFormData({ ...formData, toolType: v })}
              >
                <SelectTrigger data-testid="select-tool-type">
                  <SelectValue placeholder={t("materials.form.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`materials.toolTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("materials.form.toolState")}</Label>
                <Select
                  value={formData.toolState || "ok"}
                  onValueChange={(v) => setFormData({ ...formData, toolState: v as typeof TOOL_STATES[number] })}
                >
                  <SelectTrigger data-testid="select-tool-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">{t("materials.toolStates.ok")}</SelectItem>
                    <SelectItem value="precisa_manutencao">{t("materials.toolStates.precisa_manutencao")}</SelectItem>
                    <SelectItem value="trocar">{t("materials.toolStates.trocar")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("materials.form.lastMaintenance")}</Label>
                <Input
                  type="date"
                  value={formData.toolLastMaintenance ? (formData.toolLastMaintenance instanceof Date ? formData.toolLastMaintenance.toISOString().split('T')[0] : formData.toolLastMaintenance as string) : ""}
                  onChange={(e) => setFormData({ ...formData, toolLastMaintenance: e.target.value ? new Date(e.target.value) : undefined })}
                  data-testid="input-tool-last-maintenance"
                />
              </div>
            </div>
          </>
        );

      case "decais":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("materials.form.scale")}</Label>
                <Input
                  value={formData.decalScale || ""}
                  onChange={(e) => setFormData({ ...formData, decalScale: e.target.value })}
                  placeholder="Ex: 1/72"
                  data-testid="input-decal-scale"
                />
              </div>
              <div>
                <Label>{t("materials.form.brand")}</Label>
                <Input
                  value={formData.decalBrand || ""}
                  onChange={(e) => setFormData({ ...formData, decalBrand: e.target.value })}
                  placeholder="Ex: Caracal Models"
                  data-testid="input-decal-brand"
                />
              </div>
            </div>
            <div>
              <Label>{t("materials.form.targetKit")}</Label>
              <Input
                value={formData.decalForKit || ""}
                onChange={(e) => setFormData({ ...formData, decalForKit: e.target.value })}
                placeholder="Ex: F-16C Block 52"
                data-testid="input-decal-for-kit"
              />
            </div>
            <div>
              <Label>{t("materials.form.decoration")}</Label>
              <Input
                value={formData.decalForUnit || ""}
                onChange={(e) => setFormData({ ...formData, decalForUnit: e.target.value })}
                placeholder="Ex: 555th FS, Aviano AB"
                data-testid="input-decal-for-unit"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-10 bg-muted rounded w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-materials-title">{t("materials.title")}</h1>
          {lowStockCount > 0 && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-1">
              <AlertTriangle className="w-4 h-4" />
              {t("materials.lowStockWarning", { count: lowStockCount })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <ShareButton page="materials" />
          <Button
            onClick={() => handleOpenForm()}
            className="bg-[#D25E37] hover:bg-[#B84F2D] text-white border-[#B84F2D]"
            data-testid="button-new-material"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("materials.newMaterial")}
          </Button>
          {usage?.canExport ? (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDownloadCSV}
              disabled={filteredMaterials.length === 0}
              data-testid="button-download-materials"
              title={t("materials.exportCsv")}
            >
              <Download className="w-4 h-4" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled
                    data-testid="button-download-materials"
                    title={t("materials.exportCsv")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t("materials.premiumFeature")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("materials.searchPlaceholder")}
          className="pl-10"
          data-testid="input-search-materials"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setCurrentPage(1);
        if (value !== "tintas") {
          setBrandFilter("all");
          setColorFilter("all");
        }
      }}>
        <TabsList className="grid w-full grid-cols-4">
          {MATERIAL_TYPES.map((type) => (
            <TabsTrigger
              key={type.value}
              value={type.value}
              className="flex items-center gap-2"
              data-testid={`tab-${type.value}`}
            >
              <type.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(`materials.tabs.${type.value === "tintas" ? "paints" : type.value === "insumos" ? "supplies" : type.value === "ferramentas" ? "tools" : "decals"}`)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <input
          type="file"
          ref={photoInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
          data-testid="input-paint-photo"
        />

        {MATERIAL_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="mt-4">
            {filteredMaterials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <type.icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t("materials.noMaterialsInCategory")}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleOpenForm()}
                    data-testid="button-add-first-material"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add")} {t(`materials.tabs.${type.value === "tintas" ? "paints" : type.value === "insumos" ? "supplies" : type.value === "ferramentas" ? "tools" : "decals"}`)}
                  </Button>
                  {type.value === "tintas" && (
                    <Button
                      onClick={handlePhotoClick}
                      disabled={isAnalyzingPhoto}
                      className="mt-2 bg-[#f9aa00] hover:bg-[#e09800] text-black border-[#e09800]"
                      data-testid="button-photo-paint-register"
                    >
                      {isAnalyzingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("materials.analyzingPhoto")}
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {t("materials.registerByPhoto")}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {type.value === "tintas" && (
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handlePhotoClick}
                      disabled={isAnalyzingPhoto}
                      className="bg-[#f9aa00] hover:bg-[#e09800] text-black border-[#e09800]"
                      data-testid="button-photo-paint-register-list"
                    >
                      {isAnalyzingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("materials.analyzingPhoto")}
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {t("materials.registerByPhoto")}
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Select value={brandFilter} onValueChange={setBrandFilter}>
                        <SelectTrigger className="w-[140px]" data-testid="select-brand-filter">
                          <SelectValue placeholder={t("materials.form.brand")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("materials.filters.allBrands")}</SelectItem>
                          {uniqueBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={colorFilter} onValueChange={setColorFilter}>
                        <SelectTrigger className="w-[140px]" data-testid="select-color-filter">
                          <SelectValue placeholder={t("materials.form.color")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("materials.filters.allColors")}</SelectItem>
                          {uniqueColors.map((color) => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "recent" | "alphabetical")}>
                        <SelectTrigger className="w-[140px]" data-testid="select-sort-order">
                          <SelectValue placeholder={t("materials.filters.sort")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">
                            <span className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {t("materials.filters.recent")}
                            </span>
                          </SelectItem>
                          <SelectItem value="alphabetical">
                            <span className="flex items-center gap-2">
                              <ArrowUpAZ className="w-3 h-3" />
                              {t("materials.filters.alphabetical")}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {(brandFilter !== "all" || colorFilter !== "all") && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setBrandFilter("all"); setColorFilter("all"); }}
                          data-testid="button-clear-filters"
                        >
                          {t("materials.filters.clearFilters")}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground ml-auto">
                      <span data-testid="text-total-paints">{t("materials.stats.total")}: <strong className="text-foreground">{paintStats.total}</strong></span>
                      <span data-testid="text-paints-with-fs">FS: <strong className="text-foreground">{paintStats.withFS}</strong></span>
                      <span data-testid="text-paints-with-ral">RAL: <strong className="text-foreground">{paintStats.withRAL}</strong></span>
                      <span data-testid="text-paints-with-rlm">RLM: <strong className="text-foreground">{paintStats.withRLM}</strong></span>
                    </div>
                  </div>
                )}
                {type.value === "tintas" ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {paginatedMaterials.map(renderPaintRow)}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-3">
                      <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "recent" | "alphabetical")}>
                        <SelectTrigger className="w-[140px]" data-testid="select-sort-order-other">
                          <SelectValue placeholder={t("materials.filters.sort")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">
                            <span className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {t("materials.filters.recent")}
                            </span>
                          </SelectItem>
                          <SelectItem value="alphabetical">
                            <span className="flex items-center gap-2">
                              <ArrowUpAZ className="w-3 h-3" />
                              {t("materials.filters.alphabetical")}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {paginatedMaterials.map(renderMaterialCard)}
                    </div>
                  </>
                )}
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page-materials"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {t("materials.pagination.previous")}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t("materials.pagination.page", { current: currentPage, total: totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page-materials"
                    >
                      {t("materials.pagination.next")}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-material-form-title">
              {editingMaterial ? t("materials.editMaterial") : t("materials.newMaterial")}
            </DialogTitle>
          </DialogHeader>

          {!editingMaterial && (
            <div className="flex gap-2">
              <Input
                placeholder={t("materials.form.urlPlaceholder")}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExtractFromUrl()}
                className="flex-1"
                data-testid="input-material-url"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleExtractFromUrl}
                disabled={isExtractingFromUrl || !urlInput.trim()}
                data-testid="button-extract-material-url"
              >
                {isExtractingFromUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label>{t("materials.form.typeRequired")}</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
                disabled={!!editingMaterial}
              >
                <SelectTrigger data-testid="select-material-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`materials.tabs.${type.value === "tintas" ? "paints" : type.value === "insumos" ? "supplies" : type.value === "ferramentas" ? "tools" : "decals"}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type !== "tintas" && (
              <div>
                <Label>{t("materials.form.nameRequired")}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={async () => await lookupMaterial(formData.type || "", formData.name || "", formData.brand || "")}
                  placeholder={t("materials.form.materialName")}
                  data-testid="input-material-name"
                />
              </div>
            )}

            {formData.type !== "tintas" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("materials.form.category")}</Label>
                  <Input
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder={t("materials.form.category")}
                    data-testid="input-material-category"
                  />
                </div>
                <div>
                  <Label>{t("materials.form.brand")}</Label>
                  <Input
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    onBlur={async () => await lookupMaterial(formData.type || "", formData.name || "", formData.brand || "")}
                    placeholder={t("materials.form.brand")}
                    data-testid="input-material-brand"
                  />
                </div>
              </div>
            )}

            {formData.type !== "tintas" && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t("materials.form.unit")}</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => setFormData({ ...formData, unit: v as typeof UNITS[number] })}
                  >
                    <SelectTrigger data-testid="select-material-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{t(`materials.units.${unit}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("materials.form.currentQuantity")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.currentQuantity || 0}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) || 0 })}
                    data-testid="input-material-current-quantity"
                  />
                </div>
                <div>
                  <Label>{t("materials.form.minQuantity")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minQuantity || 0}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                    data-testid="input-material-minimum-quantity"
                  />
                </div>
              </div>
            )}

            {renderTypeSpecificFields()}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseForm} data-testid="button-cancel-material">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#D25E37] hover:bg-[#B84F2D] text-white border-[#B84F2D]"
              data-testid="button-save-material"
            >
              {createMutation.isPending || updateMutation.isPending ? t("materials.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("materials.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("materials.delete.confirmation", { name: materialToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-material">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => materialToDelete && deleteMutation.mutate(materialToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-material"
            >
              {deleteMutation.isPending ? t("materials.delete.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />

      {/* Marketplace Search Dialog */}
      <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
        <DialogContent className="max-w-md" data-testid="marketplace-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              {t("materials.marketplace.title")}
            </DialogTitle>
          </DialogHeader>
          {selectedMaterialForSearch && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  {selectedMaterialForSearch.paintHexColor && (
                    <div 
                      className="w-6 h-6 rounded-md border" 
                      style={{ backgroundColor: selectedMaterialForSearch.paintHexColor }} 
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedMaterialForSearch.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMaterialForSearch.brand} {selectedMaterialForSearch.paintCode && `- ${selectedMaterialForSearch.paintCode}`}
                    </p>
                  </div>
                </div>
              </div>

              {marketplaceLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <p className="text-muted-foreground">{t("materials.marketplace.searchingAI")}</p>
                </div>
              ) : marketplaceResults ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("materials.marketplace.aiSearchedPaint")}
                  </p>
                  {marketplaceResults.tips && (
                    <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-md">
                      {marketplaceResults.tips}
                    </p>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t("materials.marketplace.searchLinks")}</p>
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
                        <span className="flex-1 text-sm truncate">{link.query}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {t("materials.marketplace.couldNotGenerateLinks")}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarketplaceDialogOpen(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
