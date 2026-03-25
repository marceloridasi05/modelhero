import { useLocation, Link } from "wouter";
import { Home, PlayCircle, Package, BarChart3, Heart, Shield, Paintbrush } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import logoImg from "@assets/modelhero-logo6_1765850143132.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { path: "/", labelKey: "nav.home", icon: Home },
  { path: "/kits", labelKey: "nav.myKits", icon: Package },
  { path: "/em-andamento", labelKey: "nav.inProgress", icon: PlayCircle },
  { path: "/materiais", labelKey: "nav.materials", icon: Paintbrush },
  { path: "/estatisticas", labelKey: "nav.statistics", icon: BarChart3 },
  { path: "/wishlist", labelKey: "nav.wishlist", icon: Heart },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();
  const { t } = useTranslation();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div>
          <img src={logoImg} alt="ModelHero" className="h-[2.9rem] w-auto" data-testid="img-logo-sidebar" />
          <p className="text-xs text-sidebar-foreground/70 mt-1">{t('common.tagline')}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {t('nav.navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      data-testid={`sidebar-nav-${item.path.replace("/", "") || "home"}`}
                      onClick={handleNavClick}
                    >
                      <Link href={item.path}>
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">
              {t('nav.administration')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === "/admin"}
                    data-testid="sidebar-nav-admin"
                    onClick={handleNavClick}
                  >
                    <Link href="/admin">
                      <Shield className="w-4 h-4" />
                      <span>{t('nav.admin')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          ModelHero Beta v1.1
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
