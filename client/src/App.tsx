import { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { Switch, Route, useLocation, useSearch, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import {
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import NotificationBell from "@/components/NotificationBell";
import Home from "@/pages/Home";
import EmAndamento from "@/pages/EmAndamento";
import Kits from "@/pages/Kits";
import Estatisticas from "@/pages/Estatisticas";
import Wishlist from "@/pages/Wishlist";
import KitDetail from "@/pages/KitDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import WidgetRegisterPT from "@/pages/WidgetRegisterPT";
import WidgetRegisterES from "@/pages/WidgetRegisterES";
import NotFound from "@/pages/not-found";
import Admin from "@/pages/Admin";
import Materials from "@/pages/Materials";
import UpgradeSuccess from "@/pages/UpgradeSuccess";
import UpgradeCancel from "@/pages/UpgradeCancel";
import PublicProfile from "@/pages/PublicProfile";
import PublicKitDetail from "@/pages/PublicKitDetail";
import { AuthProvider, ProtectedRoute, useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Kit } from "@/components/KitCard";
import logoImg from "@assets/modelhero-logo6_1765850143132.png";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import UserMenu from "@/components/UserMenu";
import { useToast } from "@/hooks/use-toast";
import {
  GlobalLoadingProvider,
  useGlobalLoading,
} from "@/components/GlobalLoadingOverlay";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { BasePathProvider } from "@/contexts/BasePathContext";
import CurrencySelector from "@/components/CurrencySelector";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import "@/i18n";
import { useTranslation } from "react-i18next";
import { Cog } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import FreePlanBanner from "@/components/FreePlanBanner";
import { GamificationBadge } from "@/components/GamificationBadge";
import { LevelUpModal } from "@/components/LevelUpModal";
import { KitCompletedModal } from "@/components/KitCompletedModal";
import { GlobalMilestoneModals } from "@/components/GlobalMilestoneModals";
import type { GamificationStatus } from "@shared/schema";

function AppContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { showLoading, hideLoading } = useGlobalLoading();
  const { t } = useTranslation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [kitCompletedModal, setKitCompletedModal] = useState<{
    open: boolean;
    isFirstKit: boolean;
    kitName?: string;
  }>({
    open: false,
    isFirstKit: false,
  });
  const pendingKitCompletionRef = useRef<{ kitName: string } | null>(null);

  const {
    data: kits,
    isLoading,
    error: kitsError,
  } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
    queryFn: async () => {
      const response = await fetch("/api/kits", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return Array.isArray(data?.kits) ? data.kits : [];
    },
  });

  const safeKits = kits ?? [];

  const addKitMutation = useMutation({
    mutationFn: async (kitData: Omit<Kit, "id" | "userId" | "createdAt">) => {
      const response = await apiRequest("POST", "/api/kits", kitData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "LIMIT_EXCEEDED") {
          throw new Error("LIMIT_EXCEEDED");
        }
        throw new Error(errorData.message || "Erro ao criar kit");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/kits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gamification"] });
      toast({
        title: t("toasts.kitAdded"),
        description: t("toasts.kitAddedDesc"),
      });
    },
    onError: (error: Error) => {
      if (error.message === "LIMIT_EXCEEDED") {
        setShowUpgradeModal(true);
        return;
      }
      toast({
        title: t("errors.createKit"),
        description: error.message || t("errors.createKitDesc"),
        variant: "destructive",
      });
    },
  });

  const editKitMutation = useMutation({
    mutationFn: async (kit: Kit) => {
      const response = await apiRequest("PATCH", `/api/kits/${kit.id}`, kit);
      return response.json();
    },
    onSuccess: async (_data, variables) => {
      queryClient.refetchQueries({ queryKey: ["/api/kits"] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/kits", variables.id] });
      }

      if (pendingKitCompletionRef.current) {
        const kitInfo = pendingKitCompletionRef.current;
        pendingKitCompletionRef.current = null;

        try {
          const response = await fetch("/api/user/first-kit-status", {
            method: "POST",
            credentials: "include",
          });
          const data = await response.json();

          setKitCompletedModal({
            open: true,
            isFirstKit: data.isFirstKit,
            kitName: kitInfo.kitName,
          });
        } catch {
          setKitCompletedModal({
            open: true,
            isFirstKit: false,
            kitName: kitInfo.kitName,
          });
        }
      } else {
        toast({
          title: "Kit atualizado",
          description: "As alterações foram salvas com sucesso!",
        });
      }
    },
    onError: (error: Error) => {
      pendingKitCompletionRef.current = null;
      toast({
        title: "Erro ao atualizar kit",
        description:
          error.message || "Não foi possível atualizar o kit. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteKitMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/kits/${id}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/kits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "Kit excluído",
        description: "O kit foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir kit",
        description:
          error.message || "Não foi possível excluir o kit. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const duplicateKitMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/kits/${id}/duplicate`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "LIMIT_EXCEEDED") {
          throw new Error("LIMIT_EXCEEDED");
        }
        throw new Error(errorData.message || "Erro ao duplicar kit");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/kits"] });
      toast({
        title: t("toasts.kitDuplicated"),
        description: t("toasts.kitDuplicatedDesc"),
      });
    },
    onError: (error: Error) => {
      if (error.message === "LIMIT_EXCEEDED") {
        setShowUpgradeModal(true);
        return;
      }
      toast({
        title: t("errors.duplicateKit"),
        description: error.message || t("errors.duplicateKitDesc"),
        variant: "destructive",
      });
    },
  });

  const handleAddKit = (kitData: Omit<Kit, "id" | "userId" | "createdAt">) => {
    addKitMutation.mutate(kitData);
  };

  const handleEditKit = (
    formData: Omit<Kit, "id" | "userId" | "createdAt"> & { id?: string },
  ) => {
    if (!formData.id) return;
    const existingKit = safeKits.find((k) => k.id === formData.id);
    if (!existingKit) return;

    const isBecomingFinished =
      formData.status === "montado" && existingKit.status !== "montado";

    if (isBecomingFinished) {
      pendingKitCompletionRef.current = { kitName: formData.name };
    }

    const mergedKit: Kit = {
      ...existingKit,
      ...formData,
      id: existingKit.id,
      userId: existingKit.userId,
      createdAt: existingKit.createdAt,
    };
    editKitMutation.mutate(mergedKit);
  };

  const handleDeleteKit = (id: string) => {
    deleteKitMutation.mutate(id);
  };

  const handleDuplicateKit = (id: string) => {
    duplicateKitMutation.mutate(id);
  };

  const isAnyMutationPending =
    addKitMutation.isPending ||
    editKitMutation.isPending ||
    deleteKitMutation.isPending ||
    duplicateKitMutation.isPending;

  useEffect(() => {
    if (addKitMutation.isPending) {
      showLoading("Salvando kit...");
    } else if (editKitMutation.isPending) {
      showLoading("Atualizando kit...");
    } else if (deleteKitMutation.isPending) {
      showLoading("Excluindo kit...");
    } else if (duplicateKitMutation.isPending) {
      showLoading("Duplicando kit...");
    } else {
      hideLoading();
    }
  }, [
    addKitMutation.isPending,
    editKitMutation.isPending,
    deleteKitMutation.isPending,
    duplicateKitMutation.isPending,
    showLoading,
    hideLoading,
  ]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Cog className="w-16 h-16 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">
          {t("common.loadingKits")}
        </p>
      </div>
    );
  }

  if (kitsError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive text-center">
          {t("errors.loadingKits")}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          {(kitsError as Error).message}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/">
          <Home
            kits={safeKits}
            onAddKit={handleAddKit}
            onEditKit={handleEditKit}
            isSavingKit={addKitMutation.isPending || editKitMutation.isPending}
          />
        </Route>
        <Route path="/em-andamento">
          <EmAndamento
            kits={safeKits}
            onAddKit={handleAddKit}
            onEditKit={handleEditKit}
            isSavingKit={addKitMutation.isPending || editKitMutation.isPending}
          />
        </Route>
        <Route path="/kits">
          <Kits
            kits={safeKits}
            onAddKit={handleAddKit}
            onEditKit={handleEditKit}
            onDeleteKit={handleDeleteKit}
            onDuplicateKit={handleDuplicateKit}
            isSavingKit={addKitMutation.isPending || editKitMutation.isPending}
          />
        </Route>
        <Route path="/kit/:id">
          {(params) => {
            const kit = safeKits.find((k) => k.id === params.id) || null;
            return (
              <KitDetail
                kit={kit}
                onEditKit={handleEditKit}
                onBack={() => setLocation("/kits")}
                isSavingKit={editKitMutation.isPending}
              />
            );
          }}
        </Route>
        <Route path="/estatisticas">
          <Estatisticas kits={safeKits} />
        </Route>
        <Route path="/wishlist">
          <Wishlist />
        </Route>
        <Route path="/materiais">
          <Materials />
        </Route>
        <Route path="/admin">
          <Admin />
        </Route>
        <Route component={NotFound} />
      </Switch>
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
      <KitCompletedModal
        open={kitCompletedModal.open}
        onClose={() => setKitCompletedModal({ open: false, isFirstKit: false })}
        isFirstKit={kitCompletedModal.isFirstKit}
        kitName={kitCompletedModal.kitName}
      />
      <GlobalMilestoneModals />
    </>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  const search = useSearch();
  const [location, setLocation] = useLocation();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [levelUpModal, setLevelUpModal] = useState<number | null>(null);
  const previousLevelRef = useRef<number | null>(null);

  const { data: gamificationStatus } = useQuery<GamificationStatus>({
    queryKey: ["/api/gamification"],
    refetchInterval: 5000,
  });

  const acknowledgeLevelMutation = useMutation({
    mutationFn: async (level: number) => {
      const response = await apiRequest("POST", "/api/gamification/ack", {
        level,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gamification"] });
    },
  });

  const handleCloseLevelUpModal = () => {
    if (levelUpModal) {
      acknowledgeLevelMutation.mutate(levelUpModal);
    }
    setLevelUpModal(null);
  };

  useEffect(() => {
    if (
      gamificationStatus?.newLevelUnlocked &&
      gamificationStatus.newLevelUnlocked !== previousLevelRef.current
    ) {
      setLevelUpModal(gamificationStatus.newLevelUnlocked);
      previousLevelRef.current = gamificationStatus.newLevelUnlocked;
    }
  }, [gamificationStatus?.newLevelUnlocked]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("showChangePassword") === "true") {
      setChangePasswordOpen(true);
      setIsNewUser(true);
      setLocation("/", { replace: true });
    }
  }, [search, setLocation]);

  // Scroll to top when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <ProtectedRoute>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex flex-col border-b border-border sticky top-0 z-40 bg-sidebar md:bg-background">
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  <SidebarTrigger
                    className="hidden md:flex"
                    data-testid="button-sidebar-toggle"
                  />
                  <img
                    src={logoImg}
                    alt="ModelHero"
                    className="h-8 w-auto md:hidden"
                    data-testid="img-logo-mobile"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:block">
                    <GamificationBadge />
                  </div>
                  <LanguageSelector />
                  <CurrencySelector />
                  <NotificationBell />
                  <UserMenu
                    onChangePassword={() => {
                      setIsNewUser(false);
                      setChangePasswordOpen(true);
                    }}
                  />
                  <SidebarTrigger
                    className="md:hidden text-white"
                    data-testid="button-mobile-menu"
                  />
                </div>
              </div>
              <div className="md:hidden px-3 pb-2">
                <GamificationBadge />
              </div>
            </header>
            <FreePlanBanner />
            <main ref={mainRef} className="flex-1 overflow-y-auto">
              <AppContent />
            </main>
          </div>
        </div>
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          isNewUser={isNewUser}
        />
        <LevelUpModal level={levelUpModal} onClose={handleCloseLevelUpModal} />
      </SidebarProvider>
    </ProtectedRoute>
  );
}

interface LanguageRouteWrapperProps {
  defaultLanguage?: string;
  defaultCurrency?: string;
  basePath?: string;
  children: React.ReactNode;
}

function LanguageRouteWrapper({
  defaultLanguage,
  defaultCurrency,
  basePath,
  children,
}: LanguageRouteWrapperProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (defaultLanguage) {
      i18n.changeLanguage(defaultLanguage);
      localStorage.setItem("modelhero-language", defaultLanguage);
    }
    if (defaultCurrency) {
      localStorage.setItem("preferredCurrency", defaultCurrency);
    }
  }, [defaultLanguage, defaultCurrency, i18n]);

  const content = (
    <BasePathProvider basePath={basePath}>
      <CurrencyProvider defaultCurrency={defaultCurrency as any}>
        <LanguageProvider defaultLanguage={defaultLanguage as any}>
          {children}
        </LanguageProvider>
      </CurrencyProvider>
    </BasePathProvider>
  );

  if (basePath) {
    return <Router base={basePath}>{content}</Router>;
  }

  return content;
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function getSpanishCurrencyByCountry(): string {
  const lang = (
    navigator.language ||
    (navigator as any).userLanguage ||
    ""
  ).toLowerCase();
  const countryCode = lang.split(/[-_]/)[1] || "";

  const spanishCountryCurrencies: Record<string, string> = {
    es: "EUR", // Spain
    mx: "MXN", // Mexico
    ar: "ARS", // Argentina
    co: "COP", // Colombia
    cl: "CLP", // Chile
    pe: "PEN", // Peru
    uy: "UYU", // Uruguay
    ve: "VES", // Venezuela
    ec: "USD", // Ecuador (uses USD)
    bo: "BOB", // Bolivia
    py: "PYG", // Paraguay
    cr: "CRC", // Costa Rica
    cu: "CUP", // Cuba
    do: "DOP", // Dominican Republic
    gt: "GTQ", // Guatemala
    hn: "HNL", // Honduras
    ni: "NIO", // Nicaragua
    pa: "USD", // Panama (uses USD)
    sv: "USD", // El Salvador (uses USD)
  };

  return spanishCountryCurrencies[countryCode] || "EUR";
}

function getEnglishCurrencyByCountry(): string {
  const lang = (
    navigator.language ||
    (navigator as any).userLanguage ||
    ""
  ).toLowerCase();
  const countryCode = lang.split(/[-_]/)[1] || "";

  const englishCountryCurrencies: Record<string, string> = {
    gb: "GBP", // United Kingdom
    uk: "GBP", // United Kingdom (alternate)
    us: "USD", // United States
    au: "AUD", // Australia
    ca: "CAD", // Canada
    nz: "NZD", // New Zealand
    ie: "EUR", // Ireland
    sg: "SGD", // Singapore
    za: "ZAR", // South Africa
    in: "INR", // India
    hk: "HKD", // Hong Kong
    ph: "PHP", // Philippines
  };

  return englishCountryCurrencies[countryCode] || "USD";
}

function LanguageEntryRedirect({
  language,
  currency,
  detectCurrency,
}: {
  language: string;
  currency?: string;
  detectCurrency?: () => string;
}) {
  const { i18n } = useTranslation();
  const [, setLocation] = useLocation();

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem("modelhero-language", language);

    const finalCurrency =
      currency || (detectCurrency ? detectCurrency() : undefined);
    if (finalCurrency) {
      localStorage.setItem("preferredCurrency", finalCurrency);
    }

    setLocation("/", { replace: true });
  }, [language, currency, detectCurrency, i18n, setLocation]);

  return null;
}

function LegacyDeepLinkRedirect({
  rest,
  language,
  currency,
  detectCurrency,
}: {
  rest: string;
  language: string;
  currency?: string;
  detectCurrency?: () => string;
}) {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem("modelhero-language", language);

    const finalCurrency =
      currency || (detectCurrency ? detectCurrency() : undefined);
    if (finalCurrency) {
      localStorage.setItem("preferredCurrency", finalCurrency);
    }

    window.location.replace(`/${rest}`);
  }, [rest, language, currency, detectCurrency, i18n]);

  return null;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="pt" defaultCurrency="BRL">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="pt" defaultCurrency="BRL">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>

      {/* Widget routes for embedding in landing pages */}
      <Route path="/widget/register/pt">{() => <WidgetRegisterPT />}</Route>
      <Route path="/widget/register/es">{() => <WidgetRegisterES />}</Route>

      <Route path="/en/login">
        {() => (
          <LanguageRouteWrapper
            defaultLanguage="en"
            defaultCurrency={getEnglishCurrencyByCountry()}
            basePath="/en"
          >
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/en/register">
        {() => (
          <LanguageRouteWrapper
            defaultLanguage="en"
            defaultCurrency={getEnglishCurrencyByCountry()}
            basePath="/en"
          >
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/es/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="es" basePath="/es">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/es/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="es" basePath="/es">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/fr/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="fr" basePath="/fr">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/fr/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="fr" basePath="/fr">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/ge/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="de" basePath="/ge">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/ge/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="de" basePath="/ge">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/it/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="it" basePath="/it">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/it/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="it" basePath="/it">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/ru/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="ru" basePath="/ru">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/ru/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="ru" basePath="/ru">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/jp/login">
        {() => (
          <LanguageRouteWrapper defaultLanguage="ja" basePath="/jp">
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/jp/register">
        {() => (
          <LanguageRouteWrapper defaultLanguage="ja" basePath="/jp">
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>

      {/* Alternative format: /login/:lang and /register/:lang */}
      <Route path="/login/en">
        {() => (
          <LanguageRouteWrapper
            defaultLanguage="en"
            defaultCurrency={getEnglishCurrencyByCountry()}
          >
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/register/en">
        {() => (
          <LanguageRouteWrapper
            defaultLanguage="en"
            defaultCurrency={getEnglishCurrencyByCountry()}
          >
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/login/es">
        {() => (
          <LanguageRouteWrapper
            defaultLanguage="es"
            defaultCurrency={getSpanishCurrencyByCountry()}
          >
            <Login />
          </LanguageRouteWrapper>
        )}
      </Route>
      <Route path="/register/es">
        {() => (
          <LanguageRouteWrapper
            defaultLanguage="es"
            defaultCurrency={getSpanishCurrencyByCountry()}
          >
            <Register />
          </LanguageRouteWrapper>
        )}
      </Route>

      {/* Language entry points - redirect to / after setting language/currency */}
      <Route path="/en">
        {() => (
          <LanguageEntryRedirect
            language="en"
            detectCurrency={getEnglishCurrencyByCountry}
          />
        )}
      </Route>
      <Route path="/es">
        {() => (
          <LanguageEntryRedirect
            language="es"
            detectCurrency={getSpanishCurrencyByCountry}
          />
        )}
      </Route>
      <Route path="/fr">{() => <LanguageEntryRedirect language="fr" />}</Route>
      <Route path="/ge">{() => <LanguageEntryRedirect language="de" />}</Route>
      <Route path="/it">{() => <LanguageEntryRedirect language="it" />}</Route>
      <Route path="/ru">{() => <LanguageEntryRedirect language="ru" />}</Route>
      <Route path="/jp">{() => <LanguageEntryRedirect language="ja" />}</Route>

      {/* Legacy deep link redirects - redirect /:lang/:rest+ to /:rest+ with language set */}
      <Route path="/en/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="en"
            detectCurrency={getEnglishCurrencyByCountry}
          />
        )}
      </Route>
      <Route path="/es/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="es"
            detectCurrency={getSpanishCurrencyByCountry}
          />
        )}
      </Route>
      <Route path="/fr/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="fr"
          />
        )}
      </Route>
      <Route path="/ge/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="de"
          />
        )}
      </Route>
      <Route path="/it/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="it"
          />
        )}
      </Route>
      <Route path="/ru/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="ru"
          />
        )}
      </Route>
      <Route path="/jp/:rest+">
        {(params) => (
          <LegacyDeepLinkRedirect
            rest={(params as any)["rest+"] || ""}
            language="ja"
          />
        )}
      </Route>

      <Route path="/upgrade/success">
        <UpgradeSuccess />
      </Route>
      <Route path="/upgrade/cancel">
        <UpgradeCancel />
      </Route>

      <Route path="/share/:shareToken/kit/:kitId">
        <LanguageRouteWrapper>
          <PublicKitDetail />
        </LanguageRouteWrapper>
      </Route>
      <Route path="/share/:shareToken">
        <LanguageRouteWrapper>
          <PublicProfile />
        </LanguageRouteWrapper>
      </Route>

      {/* Default route - uses language from localStorage/browser */}
      <Route>
        <LanguageRouteWrapper>
          <AuthenticatedLayout />
        </LanguageRouteWrapper>
      </Route>
    </Switch>
  );
}

function LanguageFromUrlHandler() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get("lang");
    const currencyParam = urlParams.get("currency");

    if (
      langParam &&
      ["pt", "en", "es", "fr", "de", "it", "ru", "ja"].includes(langParam)
    ) {
      i18n.changeLanguage(langParam);
      localStorage.setItem("modelhero-language", langParam);
    }

    if (
      currencyParam &&
      [
        "BRL",
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CHF",
        "CNY",
        "ARS",
        "MXN",
        "CLP",
      ].includes(currencyParam)
    ) {
      localStorage.setItem("preferredCurrency", currencyParam);
    }

    if (langParam || currencyParam) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("lang");
      newUrl.searchParams.delete("currency");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [i18n]);

  return null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8" data-testid="error-boundary">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Algo deu errado</h1>
            <p className="text-muted-foreground">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              data-testid="button-reload"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GlobalLoadingProvider>
            <AuthProvider>
              <LanguageFromUrlHandler />
              <AppRouter />
            </AuthProvider>
          </GlobalLoadingProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
