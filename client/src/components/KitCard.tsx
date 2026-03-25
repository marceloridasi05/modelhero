import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit2, Package, DollarSign, Tag, PlayCircle, Check, X, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import StatusBadge, { type KitStatus } from "./StatusBadge";
import RatingStars from "./RatingStars";
import { useCurrency, type CurrencyCode } from "@/contexts/CurrencyContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Paint {
  id: string;
  brand: string;
  code: string;
  name: string;
  fsCode?: string;
  rlmCode?: string;
  ralCode?: string;
  color?: string;
}

export interface ReferenceFile {
  id: string;
  name: string;
  type: "image" | "document";
  url: string;
  thumbnail?: string;
}

export interface UsefulLink {
  id: string;
  url: string;
  description: string;
}

export type KitEtapa = 
  | "montagem" 
  | "emassamento" 
  | "pintura" 
  | "verniz" 
  | "decais" 
  | "pannel_line" 
  | "wash" 
  | "weathering" 
  | "finalizacao";

export interface MilitaryInfo {
  paintScheme?: string;
  epoch?: string;
  airForce?: string;
  army?: string;
  unit?: string;
}

export interface Kit {
  id: string;
  userId?: string;
  kitNumber?: string | null;
  name: string;
  brand: string;
  scale: string;
  type: string;
  tematica: "civil" | "militar";
  status: KitStatus;
  destino: "nenhum" | "exposto_em_casa" | "vendido" | "doado" | "emprestado" | "descartado" | "a_venda";
  salePrice?: number;
  isForSale?: boolean;
  saleListingLinks?: string[];
  soldDate?: Date | string | null;
  etapa?: KitEtapa;
  recipientName?: string;
  boxImage?: string;
  rating: number;
  paidValue: number;
  paidValueCurrency?: string;
  currentValue: number;
  hoursWorked: number;
  progress: number;
  paints?: Paint[];
  referencePhotos?: ReferenceFile[];
  referenceDocuments?: ReferenceFile[];
  usefulLinks?: UsefulLink[];
  buildPhotos?: ReferenceFile[];
  timerStartedAt?: number | null;
  notes?: string;
  aftermarkets?: string[];
  militaryInfo?: MilitaryInfo;
  comments?: string;
  instructionImages?: string[];
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  createdAt?: Date | string | null;
  colorScheme?: string;
}

interface KitCardProps {
  kit: Kit;
  onEdit?: (kit: Kit) => void;
  showSaleInfo?: boolean;
  onMarkAsSold?: (kit: Kit) => void;
  compact?: boolean;
  showUpdateProgressButton?: boolean;
  isWorkbench?: boolean;
}

export default function KitCard({ kit, onEdit, showSaleInfo = false, onMarkAsSold, compact = false, showUpdateProgressButton = false, isWorkbench = false }: KitCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { convert, formatCurrency, preferredCurrency } = useCurrency();
  
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(kit.progress);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  
  const convertedPaidValue = convert(kit.paidValue, (kit.paidValueCurrency as CurrencyCode) || "BRL", preferredCurrency);
  const convertedCurrentValue = convert(kit.currentValue, "BRL", preferredCurrency);
  const convertedSalePrice = convert(kit.salePrice || 0, "BRL", preferredCurrency);

  const handleSaveProgress = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSavingProgress(true);
    try {
      await apiRequest("PATCH", `/api/kits/${kit.id}`, { progress: progressValue });
      await queryClient.invalidateQueries({ queryKey: ["/api/kits"] });
      setIsEditingProgress(false);
      toast({
        title: t("kitCard.progressSaved"),
        description: t("kitCard.progressSavedDescription", { progress: progressValue }),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleCancelProgress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProgressValue(kit.progress);
    setIsEditingProgress(false);
  };

  const handleStartEditProgress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProgressValue(kit.progress);
    setIsEditingProgress(true);
  };
  
  if (compact) {
    return (
      <Link href={`/kit/${kit.id}`} className="block">
        <Card 
          className="hover-elevate overflow-visible cursor-pointer" 
          data-testid={`kit-card-${kit.id}`}
        >
          <CardContent className="p-2">
            {kit.boxImage ? (
              <div className="aspect-video mb-2 rounded-md overflow-hidden bg-muted">
                <img
                  src={kit.boxImage}
                  alt={kit.name}
                  className="w-full h-full object-cover"
                  data-testid={`kit-box-img-${kit.id}`}
                />
              </div>
            ) : (
              <div className="aspect-video mb-2 rounded-md bg-muted/50 flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
            <h3 className="text-xs font-medium truncate mb-1" data-testid={`kit-name-${kit.id}`}>
              {kit.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {kit.brand} - {kit.scale}
            </p>
            <Progress value={kit.progress} className="h-1.5" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{kit.progress}%</span>
              <span className="text-xs text-muted-foreground">{kit.hoursWorked}h</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/kit/${kit.id}`} className="block">
      <Card 
        className={`hover-elevate overflow-visible cursor-pointer ${isWorkbench ? "border-accent/40 bg-accent/5" : ""}`}
        data-testid={`kit-card-${kit.id}`}
      >
        <CardContent className="p-4">
          {kit.boxImage ? (
            <div className="aspect-video mb-3 rounded-md overflow-hidden bg-muted relative">
              <img
                src={kit.boxImage}
                alt={kit.name}
                className="w-full h-full object-cover"
                data-testid={`kit-box-img-${kit.id}`}
              />
              {isWorkbench && (
                <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-sm flex items-center gap-1 font-medium">
                  <PlayCircle className="w-3 h-3" />
                  {t("kitCard.active")}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video mb-3 rounded-md bg-muted/50 flex items-center justify-center relative">
              <Package className="w-8 h-8 text-muted-foreground/50" />
              {isWorkbench && (
                <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-sm flex items-center gap-1 font-medium">
                  <PlayCircle className="w-3 h-3" />
                  {t("kitCard.active")}
                </div>
              )}
            </div>
          )}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate" data-testid={`kit-name-${kit.id}`}>
                {kit.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {kit.brand} - {kit.scale}
              </p>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(kit);
              }}
              data-testid={`button-edit-kit-${kit.id}`}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <StatusBadge status={kit.status} />
              <RatingStars rating={kit.rating} />
            </div>

            {isEditingProgress ? (
              <div className="space-y-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{t("kits.form.progress")}</span>
                  <span className="tabular-nums font-medium text-foreground">{progressValue}%</span>
                </div>
                <Slider
                  value={[progressValue]}
                  onValueChange={(values) => setProgressValue(values[0])}
                  max={100}
                  step={5}
                  className="w-full"
                  data-testid={`slider-progress-${kit.id}`}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSaveProgress}
                    disabled={isSavingProgress}
                    data-testid={`button-save-progress-${kit.id}`}
                  >
                    {isSavingProgress ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {t("common.save")}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelProgress}
                    disabled={isSavingProgress}
                    data-testid={`button-cancel-progress-${kit.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{t("kits.form.progress")}</span>
                  <span className="tabular-nums">{kit.progress}%</span>
                </div>
                <Progress value={kit.progress} className="h-2" />
              </div>
            )}

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-accent" />
              <span className="tabular-nums">{t("kitCard.hoursWorked", { hours: kit.hoursWorked })}</span>
            </div>

            {showUpdateProgressButton && !isEditingProgress && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleStartEditProgress}
                data-testid={`button-update-progress-${kit.id}`}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {t("kitCard.updateProgress")}
              </Button>
            )}

            {kit.paints && kit.paints.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {kit.paints
                  .filter(p => p.color)
                  .slice(0, 12)
                  .map((paint) => (
                    <div
                      key={paint.id}
                      className="w-4 h-4 rounded-sm border border-border/50 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: paint.color }}
                      title={`${paint.brand} ${paint.code} - ${paint.name}`}
                    />
                  ))}
                {kit.paints.filter(p => p.color).length > 12 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{kit.paints.filter(p => p.color).length - 12}
                  </span>
                )}
              </div>
            )}

            {showSaleInfo && (kit.destino === "a_venda" || kit.destino === "vendido") && (
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("kitCard.sale")}</span>
                  </div>
                  <Badge 
                    variant={kit.destino === "vendido" ? "default" : "secondary"} 
                    className={kit.destino === "vendido" ? "bg-accent text-xs" : "text-xs"}
                  >
                    {kit.destino === "vendido" ? t("kitCard.sold") : t("kitCard.forSale")}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t("kitCard.purchase")}</p>
                    <p className="text-xs font-medium tabular-nums">
                      {formatCurrency(convertedPaidValue, preferredCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t("kitCard.current")}</p>
                    <p className="text-xs font-medium tabular-nums">
                      {formatCurrency(convertedCurrentValue, preferredCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t("kitCard.salePrice")}</p>
                    <p className="text-xs font-medium tabular-nums text-accent">
                      {formatCurrency(convertedSalePrice, preferredCurrency)}
                    </p>
                  </div>
                </div>
                {(kit.destino === "a_venda" || kit.isForSale) && kit.destino !== "vendido" && onMarkAsSold && (
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-[#4B6854] hover:bg-[#3d5645] text-white border-[#4B6854]"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMarkAsSold(kit);
                    }}
                    data-testid={`button-mark-sold-${kit.id}`}
                  >
                    {t("kitCard.markAsSold")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
