import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  highlight?: boolean;
}

export default function StatCard({ title, value, icon: Icon, highlight = false }: StatCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${highlight ? 'bg-secondary/10' : 'bg-accent/10'}`}>
            <Icon className={`w-5 h-5 ${highlight ? 'text-secondary' : 'text-accent'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground truncate">{t(title)}</p>
            <p className={`text-xl font-semibold tabular-nums ${highlight ? 'text-secondary' : ''}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
