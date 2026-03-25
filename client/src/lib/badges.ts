import { 
  Hammer, 
  Paintbrush, 
  Droplets, 
  Package, 
  Trophy, 
  Clock, 
  Star, 
  Target,
  Palette,
  Layers,
  Award,
  Zap,
  Crown
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tier: "bronze" | "silver" | "gold";
  category: "building" | "collection" | "dedication";
}

export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  progress: number;
  target: number;
  progressText: string;
}

export interface Kit {
  id: string;
  status: string;
  etapa?: string | null;
  hoursWorked: number;
  rating: number;
  buildPhotos?: Array<{ id: string; name?: string }> | null;
  destino?: string;
  scale?: string;
  brand?: string;
}

export const BADGES: Badge[] = [
  {
    id: "construtor_iniciante",
    name: "home.badges.list.construtor_iniciante.name",
    description: "home.badges.list.construtor_iniciante.description",
    icon: Hammer,
    tier: "bronze",
    category: "building",
  },
  {
    id: "construtor_consistente",
    name: "home.badges.list.construtor_consistente.name",
    description: "home.badges.list.construtor_consistente.description",
    icon: Hammer,
    tier: "silver",
    category: "building",
  },
  {
    id: "construtor_veterano",
    name: "home.badges.list.construtor_veterano.name",
    description: "home.badges.list.construtor_veterano.description",
    icon: Hammer,
    tier: "gold",
    category: "building",
  },
  {
    id: "pintor_dedicado",
    name: "home.badges.list.pintor_dedicado.name",
    description: "home.badges.list.pintor_dedicado.description",
    icon: Paintbrush,
    tier: "silver",
    category: "building",
  },
  {
    id: "weathering_master",
    name: "home.badges.list.weathering_master.name",
    description: "home.badges.list.weathering_master.description",
    icon: Droplets,
    tier: "gold",
    category: "building",
  },
  {
    id: "stash_controlado",
    name: "home.badges.list.stash_controlado.name",
    description: "home.badges.list.stash_controlado.description",
    icon: Package,
    tier: "silver",
    category: "collection",
  },
  {
    id: "colecionador",
    name: "home.badges.list.colecionador.name",
    description: "home.badges.list.colecionador.description",
    icon: Layers,
    tier: "bronze",
    category: "collection",
  },
  {
    id: "grande_colecionador",
    name: "home.badges.list.grande_colecionador.name",
    description: "home.badges.list.grande_colecionador.description",
    icon: Crown,
    tier: "gold",
    category: "collection",
  },
  {
    id: "dedicado",
    name: "home.badges.list.dedicado.name",
    description: "home.badges.list.dedicado.description",
    icon: Clock,
    tier: "silver",
    category: "dedication",
  },
  {
    id: "mestre_artesao",
    name: "home.badges.list.mestre_artesao.name",
    description: "home.badges.list.mestre_artesao.description",
    icon: Award,
    tier: "gold",
    category: "dedication",
  },
  {
    id: "perfeccionista",
    name: "home.badges.list.perfeccionista.name",
    description: "home.badges.list.perfeccionista.description",
    icon: Star,
    tier: "silver",
    category: "building",
  },
  {
    id: "fotografo",
    name: "home.badges.list.fotografo.name",
    description: "home.badges.list.fotografo.description",
    icon: Target,
    tier: "bronze",
    category: "dedication",
  },
  {
    id: "multi_escala",
    name: "home.badges.list.multi_escala.name",
    description: "home.badges.list.multi_escala.description",
    icon: Palette,
    tier: "bronze",
    category: "collection",
  },
  {
    id: "velocista",
    name: "home.badges.list.velocista.name",
    description: "home.badges.list.velocista.description",
    icon: Zap,
    tier: "bronze",
    category: "building",
  },
  {
    id: "finalizador",
    name: "home.badges.list.finalizador.name",
    description: "home.badges.list.finalizador.description",
    icon: Trophy,
    tier: "silver",
    category: "building",
  },
];

export function computeBadgeProgress(kits: Kit[]): BadgeProgress[] {
  const finishedKits = kits.filter((k) => k.status === "montado");
  const inProgressKits = kits.filter((k) => k.status === "em_andamento");
  const boxedKits = kits.filter((k) => k.status === "na_caixa");
  
  const totalHours = kits.reduce((sum, k) => sum + (k.hoursWorked || 0), 0);
  const totalPhotos = kits.reduce(
    (sum, k) => sum + (k.buildPhotos?.length || 0),
    0
  );
  
  const kitsWithPaintStage = kits.filter(
    (k) => k.etapa === "pintura" || 
           k.etapa === "verniz" || 
           k.etapa === "decais" || 
           k.etapa === "pannel_line" || 
           k.etapa === "wash" || 
           k.etapa === "weathering" || 
           k.etapa === "finalizacao" ||
           k.status === "montado"
  );
  
  const kitsWithWeathering = kits.filter(
    (k) => k.etapa === "weathering" || 
           k.etapa === "finalizacao" ||
           k.status === "montado"
  );
  
  const kitsWithFinalization = kits.filter(
    (k) => k.etapa === "finalizacao" || k.status === "montado"
  );
  
  const fiveStarKits = finishedKits.filter((k) => k.rating === 5);
  
  const uniqueScales = new Set(kits.map((k) => k.scale).filter(Boolean));

  const badgeProgress: BadgeProgress[] = BADGES.map((badge) => {
    let progress = 0;
    let target = 1;
    let earned = false;
    let progressText = "";

    switch (badge.id) {
      case "construtor_iniciante":
        target = 1;
        progress = finishedKits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kitFinished:${Math.min(progress, target)}:${target}`;
        break;

      case "construtor_consistente":
        target = 3;
        progress = finishedKits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kitsFinished:${Math.min(progress, target)}:${target}`;
        break;

      case "construtor_veterano":
        target = 10;
        progress = finishedKits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kitsFinished:${Math.min(progress, target)}:${target}`;
        break;

      case "pintor_dedicado":
        target = 5;
        progress = kitsWithPaintStage.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kitsPainted:${Math.min(progress, target)}:${target}`;
        break;

      case "weathering_master":
        target = 5;
        progress = kitsWithWeathering.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kitsWeathered:${Math.min(progress, target)}:${target}`;
        break;

      case "stash_controlado":
        target = 1;
        progress = finishedKits.length > boxedKits.length ? 1 : 0;
        earned = finishedKits.length > 0 && finishedKits.length > boxedKits.length;
        progressText = earned 
          ? `home.badges.progress.stashControlled:${finishedKits.length}:${boxedKits.length}`
          : `home.badges.progress.stashNotControlled:${boxedKits.length}:${finishedKits.length}`;
        break;

      case "colecionador":
        target = 10;
        progress = kits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kits:${Math.min(progress, target)}:${target}`;
        break;

      case "grande_colecionador":
        target = 25;
        progress = kits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kits:${Math.min(progress, target)}:${target}`;
        break;

      case "dedicado":
        target = 50;
        progress = Math.round(totalHours);
        earned = totalHours >= target;
        progressText = `home.badges.progress.hours:${Math.min(Math.round(progress), target)}:${target}`;
        break;

      case "mestre_artesao":
        target = 100;
        progress = Math.round(totalHours);
        earned = totalHours >= target;
        progressText = `home.badges.progress.hours:${Math.min(Math.round(progress), target)}:${target}`;
        break;

      case "perfeccionista":
        target = 3;
        progress = fiveStarKits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.fiveStarKits:${Math.min(progress, target)}:${target}`;
        break;

      case "fotografo":
        target = 20;
        progress = totalPhotos;
        earned = progress >= target;
        progressText = `home.badges.progress.photos:${Math.min(progress, target)}:${target}`;
        break;

      case "multi_escala":
        target = 3;
        progress = uniqueScales.size;
        earned = progress >= target;
        progressText = `home.badges.progress.scales:${Math.min(progress, target)}:${target}`;
        break;

      case "velocista":
        target = 3;
        progress = inProgressKits.length;
        earned = progress >= target;
        progressText = `home.badges.progress.inProgress:${Math.min(progress, target)}:${target}`;
        break;

      case "finalizador":
        target = 3;
        progress = kitsWithFinalization.length;
        earned = progress >= target;
        progressText = `home.badges.progress.kitsFinished:${Math.min(progress, target)}:${target}`;
        break;

      default:
        progressText = "0/1";
    }

    return {
      badge,
      earned,
      progress,
      target,
      progressText,
    };
  });

  return badgeProgress.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return (b.progress / b.target) - (a.progress / a.target);
  });
}

export function getEarnedBadgesCount(kits: Kit[]): number {
  return computeBadgeProgress(kits).filter((bp) => bp.earned).length;
}
