import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

const KIT_TYPE_KEYS: Record<string, string> = {
  "Avião": "airplane", "Helicóptero": "helicopter", "Militaria": "military",
  "Veículo": "vehicle", "Navio": "ship", "Submarino": "submarine",
  "Figura": "figure", "Diorama": "diorama", "Sci-Fi": "scifi", "Outro": "other",
};
import type { KitStatus } from "./StatusBadge";
import type { KitDestino } from "./DestinoBadge";

interface FilterBarProps {
  statusFilter: KitStatus | "all";
  destinoFilter: KitDestino | "all";
  typeFilter?: string;
  scaleFilter?: string;
  brandFilter?: string;
  types?: string[];
  scales?: string[];
  brands?: string[];
  onStatusChange: (status: KitStatus | "all") => void;
  onDestinoChange: (destino: KitDestino | "all") => void;
  onTypeChange?: (type: string) => void;
  onScaleChange?: (scale: string) => void;
  onBrandChange?: (brand: string) => void;
  onClearFilters: () => void;
}

export default function FilterBar({
  statusFilter,
  destinoFilter,
  typeFilter = "all",
  scaleFilter = "all",
  brandFilter = "all",
  types = [],
  scales = [],
  brands = [],
  onStatusChange,
  onDestinoChange,
  onTypeChange,
  onScaleChange,
  onBrandChange,
  onClearFilters,
}: FilterBarProps) {
  const { t } = useTranslation();
  const hasFilters = statusFilter !== "all" || destinoFilter !== "all" || typeFilter !== "all" || scaleFilter !== "all" || brandFilter !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="filter-bar">
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as KitStatus | "all")}
      >
        <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
          <SelectValue placeholder={t('common.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('kits.filters.allStatus')}</SelectItem>
          <SelectItem value="na_caixa">{t('kits.status.na_caixa')}</SelectItem>
          <SelectItem value="em_andamento">{t('kits.status.em_andamento')}</SelectItem>
          <SelectItem value="iniciado_parado">{t('kits.status.iniciado_parado')}</SelectItem>
          <SelectItem value="montado">{t('kits.status.montado')}</SelectItem>
          <SelectItem value="aguardando_reforma">{t('kits.status.aguardando_reforma')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={destinoFilter}
        onValueChange={(v) => onDestinoChange(v as KitDestino | "all")}
      >
        <SelectTrigger className="w-[160px]" data-testid="select-destino-filter">
          <SelectValue placeholder={t('kits.filters.destino')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('kits.filters.allDestino')}</SelectItem>
          <SelectItem value="exposto_em_casa">{t('kits.destino.exposto_em_casa')}</SelectItem>
          <SelectItem value="a_venda">{t('kits.destino.a_venda')}</SelectItem>
          <SelectItem value="vendido">{t('kits.destino.vendido')}</SelectItem>
          <SelectItem value="doado">{t('kits.destino.doado')}</SelectItem>
          <SelectItem value="emprestado">{t('kits.destino.emprestado')}</SelectItem>
          <SelectItem value="descartado">{t('kits.destino.descartado')}</SelectItem>
          <SelectItem value="nenhum">{t('kits.destino.nenhum')}</SelectItem>
        </SelectContent>
      </Select>

      {types.length > 0 && onTypeChange && (
        <Select
          value={typeFilter}
          onValueChange={onTypeChange}
        >
          <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
            <SelectValue placeholder={t('common.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('kits.filters.allTypes')}</SelectItem>
            {types.map((type) => (
              <SelectItem key={type} value={type}>{KIT_TYPE_KEYS[type] ? t(`kitForm.types.${KIT_TYPE_KEYS[type]}`) : type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {scales.length > 0 && onScaleChange && (
        <Select
          value={scaleFilter}
          onValueChange={onScaleChange}
        >
          <SelectTrigger className="w-[120px]" data-testid="select-scale-filter">
            <SelectValue placeholder={t('common.scale')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('kits.filters.allScales')}</SelectItem>
            {scales.map((scale) => (
              <SelectItem key={scale} value={scale}>{scale}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {brands.length > 0 && onBrandChange && (
        <Select
          value={brandFilter}
          onValueChange={onBrandChange}
        >
          <SelectTrigger className="w-[140px]" data-testid="select-brand-filter">
            <SelectValue placeholder={t('common.brand')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('kits.filters.allBrands')}</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          data-testid="button-clear-filters"
        >
          <X className="w-4 h-4 mr-1" />
          {t('kits.filters.clearFilters')}
        </Button>
      )}
    </div>
  );
}
