import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export type KitDestino = "nenhum" | "exposto_em_casa" | "vendido" | "doado" | "emprestado" | "descartado" | "a_venda";

const destinoClassNames: Record<KitDestino, string> = {
  exposto_em_casa: "bg-accent text-accent-foreground",
  a_venda: "bg-secondary/20 text-secondary dark:bg-secondary/30",
  vendido: "bg-chart-2/20 text-chart-2 dark:bg-chart-2/30",
  doado: "bg-chart-3/20 text-chart-3 dark:bg-chart-3/30",
  emprestado: "bg-chart-4/20 text-chart-4 dark:bg-chart-4/30",
  descartado: "bg-muted text-muted-foreground",
  nenhum: "bg-transparent text-muted-foreground",
};

interface DestinoBadgeProps {
  destino: KitDestino;
}

export default function DestinoBadge({ destino }: DestinoBadgeProps) {
  const { t } = useTranslation();
  
  if (!destino || destino === "nenhum") return null;
  
  const className = destinoClassNames[destino];
  if (!className) return null;
  
  const label = t(`kits.destino.${destino}`);
  
  return (
    <Badge 
      variant="outline" 
      className={`${className} text-xs border-0`}
      data-testid={`destino-badge-${destino}`}
    >
      {label}
    </Badge>
  );
}
