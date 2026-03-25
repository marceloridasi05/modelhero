import { useLocation, Link } from "wouter";
import { Home, PlayCircle, Package, BarChart3, Boxes, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const navItems = [
  { path: "/", labelKey: "nav.home", icon: Home },
  { path: "/kits", labelKey: "nav.kits", icon: Package },
  { path: "/em-andamento", labelKey: "nav.inProgress", icon: PlayCircle },
  { path: "/materiais", labelKey: "nav.materials", icon: Boxes },
  { path: "/estatisticas", labelKey: "nav.stats", icon: BarChart3 },
];

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const allNavItems = user?.isAdmin 
    ? [...navItems, { path: "/admin", labelKey: "nav.admin", icon: Shield }]
    : navItems;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16">
        {allNavItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] ${
                  isActive 
                    ? "text-secondary" 
                    : "text-muted-foreground"
                }`}
                data-testid={`nav-${item.path.replace("/", "") || "home"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{t(item.labelKey)}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-8 h-0.5 bg-secondary rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
