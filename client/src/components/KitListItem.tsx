import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Package, Tag, Calendar, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import StatusBadge, { type KitStatus } from "./StatusBadge";

const KIT_TYPE_KEYS: Record<string, string> = {
  "Avião": "airplane", "Helicóptero": "helicopter", "Militaria": "military",
  "Veículo": "vehicle", "Navio": "ship", "Submarino": "submarine",
  "Figura": "figure", "Diorama": "diorama", "Sci-Fi": "scifi", "Outro": "other",
};
import DestinoBadge, { type KitDestino } from "./DestinoBadge";
import RatingStars from "./RatingStars";
import { useCurrency, type CurrencyCode } from "@/contexts/CurrencyContext";

interface KitListItemProps {
  id: string;
  name: string;
  brand: string;
  scale: string;
  type: string;
  status: KitStatus;
  destino: KitDestino;
  rating: number;
  paidValue: number;
  paidValueCurrency?: string;
  currentValue: number;
  boxImage?: string;
  isForSale?: boolean;
  salePrice?: number;
  saleListingLinks?: string[];
  soldDate?: Date | string | null;
  showSaleInfo?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMarkAsSold?: () => void;
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function KitListItem({
  id,
  name,
  brand,
  scale,
  type,
  status,
  destino,
  rating,
  paidValue,
  paidValueCurrency,
  currentValue,
  boxImage,
  isForSale,
  salePrice,
  saleListingLinks,
  soldDate,
  showSaleInfo = false,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkAsSold,
}: KitListItemProps) {
  const { t } = useTranslation();
  const { convert, formatCurrency, preferredCurrency } = useCurrency();
  
  // Convert values to preferred currency
  const convertedPaidValue = convert(paidValue, (paidValueCurrency as CurrencyCode) || "BRL", preferredCurrency);
  const convertedCurrentValue = convert(currentValue, "BRL", preferredCurrency);
  const convertedSalePrice = convert(salePrice || 0, "BRL", preferredCurrency);
  
  const valueDiff = convertedCurrentValue - convertedPaidValue;
  const valorization = convertedPaidValue > 0 ? ((valueDiff / convertedPaidValue) * 100) : 0;
  const hasValorization = paidValue > 0 && currentValue > 0;
  
  const saleProfitDiff = convertedSalePrice - convertedPaidValue;
  const saleProfitPercent = convertedPaidValue > 0 ? ((saleProfitDiff / convertedPaidValue) * 100) : 0;
  const hasSaleProfit = paidValue > 0 && (salePrice || 0) > 0;
  const isForSaleView = showSaleInfo && (destino === "a_venda" || isForSale) && destino !== "vendido";
  return (
    <Link href={`/kit/${id}`} className="block">
      <Card className="hover-elevate overflow-visible cursor-pointer" data-testid={`kit-list-item-${id}`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {boxImage ? (
              <div className="w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={boxImage}
                  alt={name}
                  className="w-full h-full object-cover"
                  data-testid={`img-box-thumb-${id}`}
                />
              </div>
            ) : (
              <div className="w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate" data-testid={`text-kit-name-${id}`}>
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {brand} | {scale} | {KIT_TYPE_KEYS[type] ? t(`kitForm.types.${KIT_TYPE_KEYS[type]}`) : type}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end sm:hidden">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(); }} data-testid={`button-edit-${id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate?.(); }} data-testid={`button-duplicate-${id}`}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(); }} data-testid={`button-delete-${id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {showSaleInfo && (destino === "a_venda" || isForSale) && destino !== "vendido" && onMarkAsSold && (
                    <Button 
                      size="sm" 
                      className="bg-[#4B6854] hover:bg-[#3d5645] text-white border-[#4B6854]"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkAsSold(); }} 
                      data-testid={`button-mark-sold-mobile-${id}`}
                    >
                      Marcar como Vendido
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <StatusBadge status={status} />
                <DestinoBadge destino={destino} />
                {isForSale && (
                  <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground" data-testid={`badge-for-sale-${id}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    À Venda{salePrice ? ` ${formatCurrency(convertedSalePrice, preferredCurrency)}` : ''}
                  </Badge>
                )}
                <RatingStars rating={rating} />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-right">
                {showSaleInfo && (destino === "a_venda" || destino === "vendido" || isForSale) && (
                  <div className="flex items-center gap-3 justify-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Venda</p>
                      <p className="font-medium tabular-nums text-accent" data-testid={`text-kit-sale-${id}`}>
                        {formatCurrency(convertedSalePrice, preferredCurrency)}
                      </p>
                    </div>
                  </div>
                )}
                {isForSaleView && hasSaleProfit && (
                  <p className={`text-xs tabular-nums mt-0.5 ${saleProfitDiff >= 0 ? 'text-accent' : 'text-destructive'}`} data-testid={`text-kit-sale-profit-${id}`}>
                    {saleProfitDiff >= 0 ? '+' : ''}{formatCurrency(saleProfitDiff, preferredCurrency)} ({saleProfitPercent >= 0 ? '+' : ''}{saleProfitPercent.toFixed(1)}%)
                  </p>
                )}
                {isForSaleView && saleListingLinks && saleListingLinks.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1 mt-1 justify-end">
                    {saleListingLinks.map((link, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-sale-link-${id}-${idx}`}>
                        {extractDomain(link)}
                      </Badge>
                    ))}
                  </div>
                )}
                {showSaleInfo && destino === "vendido" && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span data-testid={`text-kit-sold-date-${id}`}>
                      {soldDate ? format(new Date(soldDate), "dd/MM/yyyy", { locale: ptBR }) : "Data não informada"}
                    </span>
                    {salePrice && paidValue > 0 && (
                      <span className={`ml-2 tabular-nums ${(convertedSalePrice - convertedPaidValue) >= 0 ? 'text-accent' : 'text-destructive'}`} data-testid={`text-kit-profit-${id}`}>
                        Lucro: {(convertedSalePrice - convertedPaidValue) >= 0 ? '+' : ''}{formatCurrency(convertedSalePrice - convertedPaidValue, preferredCurrency)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col gap-1 items-end">
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(); }} data-testid={`button-edit-desktop-${id}`}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate?.(); }} data-testid={`button-duplicate-desktop-${id}`}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(); }} data-testid={`button-delete-desktop-${id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {showSaleInfo && (destino === "a_venda" || isForSale) && destino !== "vendido" && onMarkAsSold && (
                  <Button 
                    size="sm" 
                    className="bg-[#4B6854] hover:bg-[#3d5645] text-white border-[#4B6854]"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkAsSold(); }} 
                    data-testid={`button-mark-sold-${id}`}
                  >
                    Marcar como Vendido
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
