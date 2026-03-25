import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, Upload, Link as LinkIcon, Trash2, Loader2, Plus, X, Camera, ImageIcon, Globe, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { KitStatus } from "./StatusBadge";
import type { KitDestino } from "./DestinoBadge";
import type { Kit, KitEtapa, MilitaryInfo } from "./KitCard";
import UploadLoadingModal from "./UploadLoadingModal";
import AIUpgradeModal from "./AIUpgradeModal";
import { useCurrency, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/contexts/CurrencyContext";
import { useKitImageUpload } from "@/hooks/use-kit-image-upload";

interface KitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kit?: Kit | null;
  onSave: (kit: Omit<Kit, "id"> & { id?: string }) => void;
  defaultStatus?: KitStatus;
  isSaving?: boolean;
}

export default function KitForm({ 
  open, 
  onOpenChange, 
  kit, 
  onSave,
  defaultStatus = "na_caixa"
}: KitFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [kitNumber, setKitNumber] = useState(kit?.kitNumber || "");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [name, setName] = useState(kit?.name || "");
  const [brand, setBrand] = useState(kit?.brand || "");
  const [scale, setScale] = useState(kit?.scale || "1/72");
  const [type, setType] = useState(kit?.type || "Avião");
  const [tematica, setTematica] = useState<"civil" | "militar">(kit?.tematica || "civil");
  const [status, setStatus] = useState<KitStatus>(kit?.status || defaultStatus);
  const [destino, setDestino] = useState<KitDestino>(kit?.destino || "nenhum");
  const [rating, setRating] = useState(kit?.rating || 0);
  const [paidValue, setPaidValue] = useState(kit?.paidValue?.toString() || "");
  const { preferredCurrency, convert, formatCurrency, getCurrencySymbol } = useCurrency();
  const [paidValueCurrency, setPaidValueCurrency] = useState<CurrencyCode>((kit?.paidValueCurrency as CurrencyCode) || preferredCurrency);
  const [currentValue, setCurrentValue] = useState(kit?.currentValue?.toString() || "");
  const [hoursWorked, setHoursWorked] = useState(kit?.hoursWorked?.toString() || "0");
  const [progress, setProgress] = useState(kit?.progress?.toString() || "0");
  const [etapa, setEtapa] = useState<KitEtapa | undefined>(kit?.etapa);
  const [recipientName, setRecipientName] = useState(kit?.recipientName || "");
  const [salePrice, setSalePrice] = useState(kit?.salePrice?.toString() || "");
  const [isForSale, setIsForSale] = useState(kit?.isForSale || false);
  const [saleListingLinks, setSaleListingLinks] = useState<string[]>(kit?.saleListingLinks || []);
  const [newSaleLink, setNewSaleLink] = useState("");
  const [boxImage, setBoxImage] = useState(kit?.boxImage || "");
  const [boxImageUrl, setBoxImageUrl] = useState("");
  const [aftermarkets, setAftermarkets] = useState<string[]>(kit?.aftermarkets || []);
  const [militaryInfo, setMilitaryInfo] = useState<MilitaryInfo>(kit?.militaryInfo || {});
  const [comments, setComments] = useState(kit?.comments || "");
  const [instructionImages, setInstructionImages] = useState<string[]>(kit?.instructionImages || []);
  const [instructionImageUrl, setInstructionImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isExtractingFromUrl, setIsExtractingFromUrl] = useState(false);
  const [isRotatingImage, setIsRotatingImage] = useState(false);
  const [showPhotoAIUpgrade, setShowPhotoAIUpgrade] = useState(false);
  const { uploadBoxImage: uploadBoxImageToStorage, uploadImages: uploadImagesToStorage, isUploading: isObjectStorageUploading } = useKitImageUpload();
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiPhotoCameraRef = useRef<HTMLInputElement>(null);
  const aiPhotoGalleryRef = useRef<HTMLInputElement>(null);

  const AFTERMARKET_OPTIONS = [
    { value: "decais", label: t("kitDetail.aftermarket.decais") },
    { value: "resina_mods", label: t("kitDetail.aftermarket.resina_mods") },
    { value: "resina_assentos", label: t("kitDetail.aftermarket.resina_assentos") },
    { value: "armamentos_extras", label: t("kitDetail.aftermarket.armamentos_extras") },
    { value: "rodas_novas", label: t("kitDetail.aftermarket.rodas_novas") },
    { value: "acessorios", label: t("kitDetail.aftermarket.acessorios") },
    { value: "scratchbuild", label: t("kitDetail.aftermarket.scratchbuild") },
  ];

  const handleExtractFromUrl = async () => {
    if (!urlInput.trim()) return;
    
    setIsExtractingFromUrl(true);
    try {
      const response = await fetch("/api/ai/extract-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: urlInput.trim(), formType: "kit" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.name) setName(data.name);
        if (data.brand) setBrand(data.brand);
        if (data.scale) setScale(data.scale);
        if (data.type) setType(data.type);
        if (data.kitNumber) setKitNumber(data.kitNumber);
        
        const fieldsFound = [
          data.name && `${t("common.name")}: ${data.name}`,
          data.brand && `${t("common.brand")}: ${data.brand}`,
          data.scale && `${t("common.scale")}: ${data.scale}`,
        ].filter(Boolean);
        
        toast({
          title: t("kitForm.dataExtracted"),
          description: fieldsFound.length > 0 
            ? fieldsFound.join(" | ")
            : t("kitForm.verifyFields"),
        });
        setUrlInput("");
      } else {
        const error = await response.json();
        toast({
          title: t("kitForm.extractionError"),
          description: error.error || t("kitForm.couldNotExtract"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("kitForm.urlProcessingFailed"),
        variant: "destructive",
      });
    } finally {
      setIsExtractingFromUrl(false);
    }
  };

  const handleAIPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fullBase64 = reader.result as string;
        const base64 = fullBase64.split(",")[1];
        
        const response = await fetch("/api/ai/extract-kit-from-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.kitNumber) setKitNumber(data.kitNumber);
          if (data.name) setName(data.name);
          if (data.brand) setBrand(data.brand);
          if (data.scale) setScale(data.scale);
          if (data.type) setType(data.type);
          if (data.tematica) setTematica(data.tematica);
          
          setBoxImage(fullBase64);
          
          const fieldsFound = [
            data.name && `${t("common.name")}: ${data.name}`,
            data.brand && `${t("common.brand")}: ${data.brand}`,
            data.scale && `${t("common.scale")}: ${data.scale}`,
          ].filter(Boolean);
          
          toast({
            title: t("kitForm.kitIdentified"),
            description: fieldsFound.length > 0 
              ? fieldsFound.join(" | ") + " | " + t("kitForm.photoSavedAsBoxImage")
              : t("kitForm.verifyFields") + ". " + t("kitForm.photoSavedAsBoxImage"),
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 403 && errorData.limitReached) {
            setShowPhotoAIUpgrade(true);
          } else {
            toast({
              title: t("kitForm.analysisError"),
              description: t("kitForm.couldNotIdentifyKit"),
              variant: "destructive",
            });
          }
        }
        setIsAnalyzingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsAnalyzingPhoto(false);
      toast({
        title: t("common.error"),
        description: t("kitForm.imageProcessingFailed"),
        variant: "destructive",
      });
    }
    
    if (aiPhotoCameraRef.current) {
      aiPhotoCameraRef.current.value = "";
    }
    if (aiPhotoGalleryRef.current) {
      aiPhotoGalleryRef.current.value = "";
    }
  };

  useEffect(() => {
    if (open) {
      setKitNumber(kit?.kitNumber || "");
      setLookupMessage("");
      setName(kit?.name || "");
      setBrand(kit?.brand || "");
      setScale(kit?.scale || "1/72");
      setType(kit?.type || "Avião");
      setTematica(kit?.tematica || "civil");
      setStatus(kit?.status || defaultStatus);
      setDestino(kit?.destino || "nenhum");
      setRating(kit?.rating || 0);
      setPaidValue(kit?.paidValue?.toString() || "");
      setPaidValueCurrency((kit?.paidValueCurrency as CurrencyCode) || preferredCurrency);
      setCurrentValue(kit?.currentValue?.toString() || "");
      setHoursWorked(kit?.hoursWorked?.toString() || "0");
      setProgress(kit?.progress?.toString() || "0");
      setEtapa(kit?.etapa);
      setRecipientName(kit?.recipientName || "");
      setSalePrice(kit?.salePrice?.toString() || "");
      setIsForSale(kit?.isForSale || false);
      setSaleListingLinks(kit?.saleListingLinks || []);
      setNewSaleLink("");
      setBoxImage(kit?.boxImage || "");
      setBoxImageUrl("");
      setAftermarkets(kit?.aftermarkets || []);
      setMilitaryInfo(kit?.militaryInfo || {});
      setComments(kit?.comments || "");
      setInstructionImages(kit?.instructionImages || []);
      setInstructionImageUrl("");
    }
  }, [open, kit, defaultStatus]);

  const lookupKitByNumber = async (number: string) => {
    if (!number || number.trim().length < 2) {
      setLookupMessage("");
      return;
    }
    setIsLookingUp(true);
    setLookupMessage(t("kitForm.searching"));
    try {
      const response = await fetch(`/api/kits/lookup/${encodeURIComponent(number.trim())}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setName(data.name);
        setScale(data.scale);
        setBrand(data.brand);
        setLookupMessage(t("kitForm.dataFilledAutomatically"));
      } else {
        setLookupMessage("");
      }
    } catch {
      setLookupMessage("");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleKitNumberChange = (value: string) => {
    setKitNumber(value);
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }
    lookupTimeoutRef.current = setTimeout(() => {
      lookupKitByNumber(value);
    }, 500);
  };

  const showRecipientField = destino === "vendido" || destino === "doado" || destino === "emprestado";
  const showMilitaryInfo = tematica === "militar";

  useEffect(() => {
    if (destino === "a_venda") {
      setIsForSale(true);
    } else if (destino !== "nenhum" && destino !== "exposto_em_casa") {
      setIsForSale(false);
      setSalePrice("");
    }
  }, [destino]);

  const toggleAftermarket = (value: string) => {
    setAftermarkets(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value) 
        : [...prev, value]
    );
  };

  const handleBoxImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMessage(t("kitDetail.boxImage.uploading"));
    setIsUploading(true);

    try {
      const url = await uploadBoxImageToStorage(file);
      if (url) {
        setBoxImage(url);
      } else {
        toast({
          title: t("common.error"),
          description: t("kitForm.uploadFailed"),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error uploading box image:", err);
      toast({
        title: t("common.error"),
        description: t("kitForm.uploadFailed"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
    e.target.value = "";
  };

  const handleBoxImageUrl = () => {
    if (boxImageUrl.trim()) {
      setBoxImage(boxImageUrl.trim());
      setBoxImageUrl("");
    }
  };

  const handleRemoveBoxImage = () => {
    setBoxImage("");
  };

  const handleRotateBoxImage = async () => {
    if (!boxImage || isRotatingImage) return;
    setIsRotatingImage(true);
    
    try {
      let imageBlob: Blob;
      if (boxImage.startsWith('data:')) {
        const response = await fetch(boxImage);
        imageBlob = await response.blob();
      } else if (boxImage.startsWith('/objects/')) {
        const response = await fetch(boxImage);
        if (!response.ok) throw new Error("Failed to fetch image");
        imageBlob = await response.blob();
      } else {
        const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(boxImage)}`);
        if (!response.ok) throw new Error("Failed to fetch image");
        imageBlob = await response.blob();
      }
      
      const localUrl = URL.createObjectURL(imageBlob);
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
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
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/jpeg", 0.9);
      });
      
      const rotatedFile = new File([rotatedBlob], `rotated-${Date.now()}.jpg`, { type: "image/jpeg" });
      const uploadedUrl = await uploadBoxImageToStorage(rotatedFile);
      
      if (uploadedUrl) {
        setBoxImage(uploadedUrl);
      } else {
        throw new Error("Failed to upload rotated image");
      }
    } catch (err) {
      console.error("Error rotating image:", err);
      toast({
        title: t("kitDetail.boxImage.rotateError"),
        description: t("kitForm.couldNotRotateImage"),
        variant: "destructive",
      });
    } finally {
      setIsRotatingImage(false);
    }
  };

  const handleInstructionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMessage(t("kitForm.uploadingInstruction"));
    setIsUploading(true);

    try {
      const url = await uploadBoxImageToStorage(file);
      if (url) {
        setInstructionImages(prev => [...prev, url]);
      }
    } catch (err) {
      console.error("Error uploading instruction image:", err);
    } finally {
      setIsUploading(false);
    }
    e.target.value = "";
  };

  const handleInstructionImageUrl = () => {
    if (instructionImageUrl.trim()) {
      setInstructionImages(prev => [...prev, instructionImageUrl.trim()]);
      setInstructionImageUrl("");
    }
  };

  const handleRemoveInstructionImage = (index: number) => {
    setInstructionImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isBecomingFinished = status === "montado" && kit?.status !== "montado";
    const isNoLongerFinished = status !== "montado" && kit?.status === "montado";
    
    onSave({
      id: kit?.id,
      kitNumber: kitNumber.trim() || undefined,
      name,
      brand,
      scale,
      type,
      tematica,
      status,
      destino,
      etapa: etapa || undefined,
      recipientName: showRecipientField ? recipientName : undefined,
      isForSale,
      salePrice: isForSale ? (parseFloat(salePrice) || 0) : undefined,
      saleListingLinks: isForSale && saleListingLinks.length > 0 ? saleListingLinks : undefined,
      boxImage: boxImage || undefined,
      rating,
      paidValue: parseFloat(paidValue) || 0,
      paidValueCurrency,
      currentValue: parseFloat(currentValue) || 0,
      hoursWorked: parseFloat(hoursWorked) || 0,
      progress: parseInt(progress) || 0,
      aftermarkets: aftermarkets.length > 0 ? aftermarkets : undefined,
      militaryInfo: showMilitaryInfo && Object.values(militaryInfo).some(v => v) ? militaryInfo : undefined,
      comments: comments.trim() || undefined,
      instructionImages: instructionImages.length > 0 ? instructionImages : undefined,
      endDate: isBecomingFinished ? new Date().toISOString() : (isNoLongerFinished ? undefined : kit?.endDate),
      startDate: kit?.startDate,
    });
    onOpenChange(false);
  };

  const isEditing = !!kit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="kit-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("kits.editKit") : t("kitForm.newKit")}
          </DialogTitle>
        </DialogHeader>

        {!isEditing && (
          <div className="pb-2">
            <input
              ref={aiPhotoCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleAIPhotoSelect}
              data-testid="input-ai-photo-camera"
            />
            <input
              ref={aiPhotoGalleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAIPhotoSelect}
              data-testid="input-ai-photo-gallery"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1 bg-[#f9aa00] hover:bg-[#e09800] text-black border-[#e09800]"
                onClick={() => aiPhotoCameraRef.current?.click()}
                disabled={isAnalyzingPhoto}
                data-testid="button-ai-photo-camera"
              >
                {isAnalyzingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("kitForm.analyzing")}
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    {t("home.photoWithAI")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => aiPhotoGalleryRef.current?.click()}
                disabled={isAnalyzingPhoto}
                data-testid="button-ai-photo-gallery"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t("kitForm.pasteProductUrl")}
                disabled={isExtractingFromUrl}
                data-testid="input-url-extract"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleExtractFromUrl}
                disabled={isExtractingFromUrl || !urlInput.trim()}
                data-testid="button-url-extract"
              >
                {isExtractingFromUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kitNumber">{t("kitForm.kitNumberOptional")}</Label>
            <div className="relative">
              <Input
                id="kitNumber"
                value={kitNumber}
                onChange={(e) => handleKitNumberChange(e.target.value)}
                placeholder={t("kitForm.kitNumberPlaceholder")}
                data-testid="input-kit-number"
                className={isLookingUp ? "pr-8" : ""}
              />
              {isLookingUp && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {lookupMessage && (
              <p className="text-xs text-muted-foreground" data-testid="kit-lookup-message">{lookupMessage}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("kitForm.modelName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("kitForm.modelNamePlaceholder")}
              required
              data-testid="input-kit-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">{t("common.brand")}</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={t("kitForm.brandPlaceholder")}
                required
                data-testid="input-kit-brand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale">{t("common.scale")}</Label>
              <Select value={scale} onValueChange={setScale}>
                <SelectTrigger data-testid="select-kit-scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/6">1/6</SelectItem>
                  <SelectItem value="1/12">1/12</SelectItem>
                  <SelectItem value="1/24">1/24</SelectItem>
                  <SelectItem value="1/32">1/32</SelectItem>
                  <SelectItem value="1/35">1/35</SelectItem>
                  <SelectItem value="1/48">1/48</SelectItem>
                  <SelectItem value="1/50">1/50</SelectItem>
                  <SelectItem value="1/72">1/72</SelectItem>
                  <SelectItem value="1/100">1/100</SelectItem>
                  <SelectItem value="1/144">1/144</SelectItem>
                  <SelectItem value="1/350">1/350</SelectItem>
                  <SelectItem value="1/700">1/700</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t("common.type")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-kit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avião">{t("kitForm.types.airplane")}</SelectItem>
                  <SelectItem value="Helicóptero">{t("kitForm.types.helicopter")}</SelectItem>
                  <SelectItem value="Militaria">{t("kitForm.types.military")}</SelectItem>
                  <SelectItem value="Veículo">{t("kitForm.types.vehicle")}</SelectItem>
                  <SelectItem value="Navio">{t("kitForm.types.ship")}</SelectItem>
                  <SelectItem value="Submarino">{t("kitForm.types.submarine")}</SelectItem>
                  <SelectItem value="Figura">{t("kitForm.types.figure")}</SelectItem>
                  <SelectItem value="Diorama">{t("kitForm.types.diorama")}</SelectItem>
                  <SelectItem value="Sci-Fi">{t("kitForm.types.scifi")}</SelectItem>
                  <SelectItem value="Outro">{t("kitForm.types.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tematica">{t("kitForm.theme")}</Label>
              <Select value={tematica} onValueChange={(v) => setTematica(v as "civil" | "militar")}>
                <SelectTrigger data-testid="select-kit-tematica">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">{t("kitDetail.info.civil")}</SelectItem>
                  <SelectItem value="militar">{t("kitDetail.info.military")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidValue">{t("kits.form.paidValue")}</Label>
            <div className="flex gap-2">
              <Select value={paidValueCurrency} onValueChange={(v) => setPaidValueCurrency(v as CurrencyCode)}>
                <SelectTrigger className="w-24" data-testid="select-kit-paid-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="paidValue"
                type="number"
                step="0.01"
                min="0"
                value={paidValue}
                onChange={(e) => setPaidValue(e.target.value)}
                placeholder="0,00"
                className="flex-1"
                data-testid="input-kit-paid-value"
              />
            </div>
            {paidValue && parseFloat(paidValue) > 0 && paidValueCurrency !== preferredCurrency && (
              <p className="text-xs text-muted-foreground" data-testid="text-converted-value">
                {formatCurrency(convert(parseFloat(paidValue), paidValueCurrency, preferredCurrency), preferredCurrency)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentValue">{t("kitForm.currentValueLabel")} ({getCurrencySymbol(paidValueCurrency)})</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                min="0"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0,00"
                data-testid="input-kit-current-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as KitStatus)}>
                <SelectTrigger data-testid="select-kit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="na_caixa">{t("kits.status.na_caixa")}</SelectItem>
                  <SelectItem value="em_andamento">{t("kits.status.em_andamento")}</SelectItem>
                  <SelectItem value="iniciado_parado">{t("kitForm.status.iniciado_parado")}</SelectItem>
                  <SelectItem value="montado">{t("kitForm.status.finished")}</SelectItem>
                  <SelectItem value="aguardando_reforma">{t("kits.status.aguardando_reforma")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "em_andamento" && (
              <div className="space-y-2">
                <Label htmlFor="etapa">{t("kitForm.stage")}</Label>
                <Select value={etapa || ""} onValueChange={(v) => setEtapa(v as KitEtapa)}>
                  <SelectTrigger data-testid="select-kit-etapa">
                    <SelectValue placeholder={t("kitForm.selectStage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="montagem">{t("kitDetail.etapas.montagem")}</SelectItem>
                    <SelectItem value="emassamento">{t("kitDetail.etapas.emassamento")}</SelectItem>
                    <SelectItem value="pintura">{t("kitDetail.etapas.pintura")}</SelectItem>
                    <SelectItem value="verniz">{t("kitDetail.etapas.verniz")}</SelectItem>
                    <SelectItem value="decais">{t("kitDetail.etapas.decais")}</SelectItem>
                    <SelectItem value="pannel_line">{t("kitDetail.etapas.pannel_line")}</SelectItem>
                    <SelectItem value="wash">{t("kitDetail.etapas.wash")}</SelectItem>
                    <SelectItem value="weathering">{t("kitDetail.etapas.weathering")}</SelectItem>
                    <SelectItem value="finalizacao">{t("kitDetail.etapas.finalizacao")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {status === "montado" && (
              <div className="space-y-2">
                <Label htmlFor="destino">{t("kitForm.destination")}</Label>
                <Select value={destino} onValueChange={(v) => setDestino(v as KitDestino)}>
                  <SelectTrigger data-testid="select-kit-destino">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">{t("common.none")}</SelectItem>
                    <SelectItem value="exposto_em_casa">{t("kitForm.destino.exposto_em_casa")}</SelectItem>
                    <SelectItem value="a_venda">{t("kitForm.destino.a_venda")}</SelectItem>
                    <SelectItem value="vendido">{t("kits.destino.vendido")}</SelectItem>
                    <SelectItem value="doado">{t("kits.destino.doado")}</SelectItem>
                    <SelectItem value="emprestado">{t("kitForm.destino.emprestado")}</SelectItem>
                    <SelectItem value="descartado">{t("kits.destino.descartado")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {showRecipientField && status === "montado" && (
            <div className="space-y-2">
              <Label htmlFor="recipientName">{t("kitForm.recipientQuestion")}</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={t("kitForm.recipientPlaceholder")}
                data-testid="input-kit-recipient"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isForSale"
                checked={isForSale}
                onCheckedChange={(checked) => setIsForSale(checked === true)}
                data-testid="checkbox-is-for-sale"
              />
              <Label
                htmlFor="isForSale"
                className="text-sm font-normal cursor-pointer"
              >
                {t("kitForm.isForSaleQuestion")}
              </Label>
            </div>

            {isForSale && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">{t("kitForm.salePriceLabel")}</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0,00"
                    data-testid="input-kit-sale-price"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t("kitForm.listingLinks")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSaleLink}
                      onChange={(e) => setNewSaleLink(e.target.value)}
                      placeholder="https://..."
                      data-testid="input-sale-link"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newSaleLink.trim()) {
                            setSaleListingLinks(prev => [...prev, newSaleLink.trim()]);
                            setNewSaleLink("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (newSaleLink.trim()) {
                          setSaleListingLinks(prev => [...prev, newSaleLink.trim()]);
                          setNewSaleLink("");
                        }
                      }}
                      data-testid="button-add-sale-link"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {saleListingLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {saleListingLinks.map((link, index) => {
                        let domain = link;
                        try {
                          domain = new URL(link).hostname.replace(/^www\./, '');
                        } catch {}
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                            data-testid={`badge-sale-link-${index}`}
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span className="max-w-[150px] truncate">{domain}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => setSaleListingLinks(prev => prev.filter((_, i) => i !== index))}
                              data-testid={`button-remove-sale-link-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">{t("kits.form.hoursWorked")}</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                data-testid="input-kit-hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">{t("kits.form.progress")} ({progress}%)</Label>
              <Slider
                id="progress"
                min={0}
                max={100}
                step={1}
                value={[parseInt(progress) || 0]}
                onValueChange={(value) => setProgress(value[0].toString())}
                className="w-full"
                data-testid="slider-kit-progress"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("kitForm.rating")}</Label>
            <div className="flex items-center gap-1" data-testid="rating-input">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-0.5"
                  data-testid={`button-rating-${star}`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating
                        ? "fill-secondary text-secondary"
                        : "text-muted"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground tabular-nums">
                {rating}/10
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("kitForm.aftermarketsUsed")}</Label>
            <div className="grid grid-cols-2 gap-2" data-testid="aftermarkets-section">
              {AFTERMARKET_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`aftermarket-${option.value}`}
                    checked={aftermarkets.includes(option.value)}
                    onCheckedChange={() => toggleAftermarket(option.value)}
                    data-testid={`checkbox-aftermarket-${option.value}`}
                  />
                  <Label
                    htmlFor={`aftermarket-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {showMilitaryInfo && (
            <div className="space-y-3" data-testid="military-info-section">
              <Label className="text-base">{t("kitForm.militaryInfo")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="paintScheme" className="text-sm">{t("kitForm.paintScheme")}</Label>
                  <Input
                    id="paintScheme"
                    value={militaryInfo.paintScheme || ""}
                    onChange={(e) => setMilitaryInfo({ ...militaryInfo, paintScheme: e.target.value })}
                    placeholder={t("kitForm.paintSchemePlaceholder")}
                    data-testid="input-paint-scheme"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epoch" className="text-sm">{t("kitForm.epoch")}</Label>
                  <Input
                    id="epoch"
                    value={militaryInfo.epoch || ""}
                    onChange={(e) => setMilitaryInfo({ ...militaryInfo, epoch: e.target.value })}
                    placeholder={t("kitForm.epochPlaceholder")}
                    data-testid="input-epoch"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="airForce" className="text-sm">{t("kitForm.airForce")}</Label>
                  <Input
                    id="airForce"
                    value={militaryInfo.airForce || ""}
                    onChange={(e) => setMilitaryInfo({ ...militaryInfo, airForce: e.target.value })}
                    placeholder={t("kitForm.airForcePlaceholder")}
                    data-testid="input-air-force"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="army" className="text-sm">{t("kitForm.armyNavy")}</Label>
                  <Input
                    id="army"
                    value={militaryInfo.army || ""}
                    onChange={(e) => setMilitaryInfo({ ...militaryInfo, army: e.target.value })}
                    placeholder={t("kitForm.armyNavyPlaceholder")}
                    data-testid="input-army"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="unit" className="text-sm">{t("kitForm.unitSquadron")}</Label>
                  <Input
                    id="unit"
                    value={militaryInfo.unit || ""}
                    onChange={(e) => setMilitaryInfo({ ...militaryInfo, unit: e.target.value })}
                    placeholder={t("kitForm.unitSquadronPlaceholder")}
                    data-testid="input-unit"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">{t("kitForm.comments")}</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t("kitForm.commentsPlaceholder")}
              className="min-h-[80px]"
              data-testid="textarea-comments"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("kitForm.instructionsAndDecals")}</Label>
            {instructionImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2" data-testid="instruction-images-grid">
                {instructionImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`${t("kitForm.instruction")} ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md bg-muted"
                      data-testid={`img-instruction-${index}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveInstructionImage(index)}
                      data-testid={`button-remove-instruction-${index}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex-1">
                  <LinkIcon className="w-4 h-4 mr-1" />
                  URL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-2">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleInstructionImageUpload}
                    data-testid="input-instruction-image-upload"
                  />
                  <div className="border-2 border-dashed rounded-md p-3 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t("kitForm.addImage")}</p>
                  </div>
                </label>
              </TabsContent>
              <TabsContent value="url" className="mt-2">
                <div className="flex gap-2">
                  <Input
                    value={instructionImageUrl}
                    onChange={(e) => setInstructionImageUrl(e.target.value)}
                    placeholder={t("kitForm.instructionUrlPlaceholder")}
                    data-testid="input-instruction-image-url"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleInstructionImageUrl}
                    disabled={!instructionImageUrl.trim()}
                    data-testid="button-add-instruction-url"
                  >
                    {t("common.add")}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label>{t("kitDetail.boxImage.title")}</Label>
            {boxImage ? (
              <div className="relative group">
                <img
                  src={boxImage}
                  alt={t("kitDetail.boxImage.boxAlt")}
                  className="w-full h-32 object-contain rounded-md bg-muted"
                  data-testid="img-box-preview"
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="w-7 h-7"
                    onClick={handleRotateBoxImage}
                    disabled={isRotatingImage}
                    data-testid="button-rotate-box-image-form"
                  >
                    {isRotatingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="w-7 h-7"
                    onClick={handleRemoveBoxImage}
                    data-testid="button-remove-box-image-form"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1">
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex-1">
                    <LinkIcon className="w-4 h-4 mr-1" />
                    URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-2">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBoxImageUpload}
                      data-testid="input-box-image-upload"
                    />
                    <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t("kitForm.clickToSelect")}</p>
                    </div>
                  </label>
                </TabsContent>
                <TabsContent value="url" className="mt-2">
                  <div className="flex gap-2">
                    <Input
                      value={boxImageUrl}
                      onChange={(e) => setBoxImageUrl(e.target.value)}
                      placeholder={t("kitDetail.boxImage.urlPlaceholder")}
                      data-testid="input-box-image-url"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBoxImageUrl}
                      disabled={!boxImageUrl.trim()}
                      data-testid="button-add-box-url"
                    >
                      {t("common.add")}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-kit"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="secondary" data-testid="button-save-kit">
              {isEditing ? t("common.save") : t("common.add")}
            </Button>
          </DialogFooter>
        </form>

        <UploadLoadingModal open={isUploading} message={uploadMessage} />
        <AIUpgradeModal 
          open={showPhotoAIUpgrade} 
          onOpenChange={setShowPhotoAIUpgrade} 
          type="photoAI" 
        />
      </DialogContent>
    </Dialog>
  );
}
