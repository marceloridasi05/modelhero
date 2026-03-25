import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export type KitStatus = "na_caixa" | "em_andamento" | "iniciado_parado" | "montado" | "aguardando_reforma";

const statusClassNames: Record<KitStatus, string> = {
  na_caixa: "bg-muted text-muted-foreground",
  em_andamento: "bg-secondary text-secondary-foreground",
  iniciado_parado: "bg-accent text-accent-foreground",
  montado: "bg-primary text-primary-foreground",
  aguardando_reforma: "bg-destructive/80 text-destructive-foreground",
};

interface StatusBadgeProps {
  status: KitStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const className = statusClassNames[status];
  const label = t(`kits.status.${status}`);
  
  return (
    <Badge 
      variant="secondary" 
      className={`${className} text-xs`}
      data-testid={`status-badge-${status}`}
    >
      {label}
    </Badge>
  );
}
