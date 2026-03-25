import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";

const KIT_TYPE_KEYS: Record<string, string> = {
  "Avião": "airplane", "Helicóptero": "helicopter", "Militaria": "military",
  "Veículo": "vehicle", "Navio": "ship", "Submarino": "submarine",
  "Figura": "figure", "Diorama": "diorama", "Sci-Fi": "scifi", "Outro": "other",
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Package, Clock, DollarSign, Palette, ChevronLeft, ChevronRight, FileText, Image, X, UserPlus } from "lucide-react";
import logoImg from "@assets/modelhero-logo6_1765850143132.png";
import StatusBadge from "@/components/StatusBadge";
import RatingStars from "@/components/RatingStars";
import type { KitStatus } from "@/components/StatusBadge";
import { getRegisterPath, getModelHeroHomeUrl } from "@/lib/publicUtils";

interface PhotoItem {
  id: string;
  name: string;
  url: string;
  type?: string;
}

interface PublicKit {
  id: string;
  name: string;
  brand: string;
  scale: string;
  type: string;
  status: KitStatus;
  progress: number;
  hoursWorked: number;
  paidValue: number;
  currentValue: number;
  boxImage?: string | null;
  rating: number;
  notes?: string;
  paints?: { id: string; brand: string; code: string; name: string; color?: string; fsCode?: string; rlmCode?: string; ralCode?: string }[];
  buildPhotos?: PhotoItem[];
  referencePhotos?: PhotoItem[];
  destino?: string;
  isForSale?: boolean;
  salePrice?: number;
}

interface PublicProfile {
  name: string;
  shareToken: string;
}

export default function PublicKitDetail() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ shareToken: string; kitId: string }>();
  const shareToken = params.shareToken;
  const kitId = params.kitId;

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoItem[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: profile } = useQuery<PublicProfile>({
    queryKey: ["/api/public", shareToken, "profile"],
    queryFn: async () => {
      const res = await fetch(`/api/public/${shareToken}/profile`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!shareToken,
  });

  const { data: kit, isLoading, error } = useQuery<PublicKit>({
    queryKey: ["/api/public", shareToken, "kits", kitId],
    queryFn: async () => {
      const res = await fetch(`/api/public/${shareToken}/kits/${kitId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!shareToken && !!kitId,
  });

  const openGallery = useCallback((photos: PhotoItem[], index: number) => {
    setGalleryPhotos(photos);
    setGalleryIndex(index);
    setGalleryOpen(true);
  }, []);

  const handlePrevGallery = useCallback(() => {
    setGalleryIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNextGallery = useCallback(() => {
    setGalleryIndex((i) => Math.min(galleryPhotos.length - 1, i + 1));
  }, [galleryPhotos.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-kit-detail">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" data-testid="kit-not-found">
        <Package className="w-16 h-16 text-muted-foreground/50" />
        <p className="text-lg text-muted-foreground">
          {t("share.profileNotFound", { defaultValue: "Profile not found" })}
        </p>
      </div>
    );
  }

  const buildPhotos = (kit.buildPhotos ?? []).filter((p): p is PhotoItem => !!p && typeof p === "object" && !!p.url);
  const paints = kit.paints ?? [];
  const referenceImages = (kit.referencePhotos ?? []).filter((r): r is PhotoItem => !!r && typeof r === "object" && !!r.url && r.type === "image");
  const referenceDocs = (kit.referencePhotos ?? []).filter((r) => r.type === "pdf");

  const isPt = i18n.language.startsWith("pt");
  const referencesTitle = isPt
    ? `Referências (${referenceImages.length + referenceDocs.length})`
    : `${t("kitDetail.references", { defaultValue: "References" })} (${referenceImages.length + referenceDocs.length})`;

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}min`;
  };

  const homeUrl = getModelHeroHomeUrl(i18n.language);

  const kitInfoCard = (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold" data-testid="text-kit-name">{kit.name}</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-kit-details">
            {kit.brand} | {kit.scale} | {KIT_TYPE_KEYS[kit.type] ? t(`kitForm.types.${KIT_TYPE_KEYS[kit.type]}`) : kit.type}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <StatusBadge status={kit.status} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("share.progress", { defaultValue: "Progress" })}</span>
            <span className="font-medium tabular-nums">{kit.progress}%</span>
          </div>
          <Progress value={kit.progress} className="h-2" />
        </div>
        {kit.rating > 0 && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t("share.rating", { defaultValue: "Rating" })}</p>
            <RatingStars rating={kit.rating} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const hoursCard = (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-accent/10">
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("share.hoursWorked", { defaultValue: "Hours Worked" })}</p>
            <p className="font-medium tabular-nums" data-testid="text-hours-worked">{formatHours(kit.hoursWorked)}</p>
          </div>
        </div>
        {kit.paidValue > 0 && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent/10">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kitDetail.paidValue", { defaultValue: "Paid Value" })}</p>
              <p className="font-medium tabular-nums" data-testid="text-paid-value">R$ {kit.paidValue.toFixed(2)}</p>
            </div>
          </div>
        )}
        {kit.currentValue > 0 && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent/10">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("kitDetail.currentValue", { defaultValue: "Current Value" })}</p>
              <p className="font-medium tabular-nums" data-testid="text-current-value">R$ {kit.currentValue.toFixed(2)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const boxImageCard = kit.boxImage ? (
    <Card>
      <CardContent className="p-0">
        <div className="w-full aspect-video rounded-md overflow-hidden bg-muted">
          <img
            src={kit.boxImage}
            alt={kit.name}
            className="w-full h-full object-contain"
            data-testid="img-kit-box-large"
          />
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardContent className="p-0">
        <div className="w-full aspect-video rounded-md bg-muted/50 flex items-center justify-center">
          <Package className="w-20 h-20 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>
  );

  const paintsCard = paints.length > 0 ? (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t("share.paints", { defaultValue: "Paints" })} ({paints.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2" data-testid="paints-list">
          {paints.map((paint) => (
            <div key={paint.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50" data-testid={`paint-item-${paint.id}`}>
              {paint.color && (
                <div
                  className="w-6 h-6 rounded-md border flex-shrink-0"
                  style={{ backgroundColor: paint.color }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{paint.name}</p>
                <p className="text-sm text-muted-foreground">
                  {paint.brand} {paint.code && `- ${paint.code}`}
                  {paint.fsCode && ` | FS ${paint.fsCode}`}
                  {paint.rlmCode && ` | RLM ${paint.rlmCode}`}
                  {paint.ralCode && ` | RAL ${paint.ralCode}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const buildPhotosCard = buildPhotos.length > 0 ? (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="w-5 h-5" />
          {t("share.buildPhotos", { defaultValue: "Build Photos" })} ({buildPhotos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" data-testid="build-photos-grid">
          {buildPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-video cursor-pointer group"
              onClick={() => openGallery(buildPhotos, index)}
              data-testid={`build-photo-thumb-${photo.id}`}
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover rounded-md hover:opacity-80 transition-opacity"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const referencesCard = (referenceImages.length > 0 || referenceDocs.length > 0) ? (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {referencesTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" data-testid="reference-photos-grid">
          {referenceImages.map((ref, index) => (
            <div
              key={ref.id}
              className="relative aspect-video cursor-pointer group"
              onClick={() => openGallery(referenceImages, index)}
              data-testid={`ref-photo-thumb-${ref.id}`}
            >
              <img
                src={ref.url}
                alt={ref.name}
                className="w-full h-full object-cover rounded-md hover:opacity-80 transition-opacity"
              />
            </div>
          ))}
          {referenceDocs.map((doc) => (
            <div key={doc.id} className="rounded-md overflow-hidden bg-muted aspect-video flex flex-col items-center justify-center text-muted-foreground" data-testid={`ref-doc-${doc.id}`}>
              <FileText className="w-8 h-8 mb-1" />
              <span className="text-xs truncate max-w-full px-2">{doc.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const notesCard = kit.notes ? (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t("share.notes", { defaultValue: "Notes" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground whitespace-pre-wrap" data-testid="text-kit-notes">
          {kit.notes}
        </p>
      </CardContent>
    </Card>
  ) : null;

  return (
    <div className="min-h-screen bg-background" data-testid="page-public-kit-detail">
      <header className="sticky top-0 z-40" style={{ backgroundColor: "hsl(var(--sidebar))" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoImg} alt="ModelHero" className="h-8 w-auto" data-testid="img-public-logo" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }} data-testid="text-profile-name">
              {profile?.name
                ? t("share.publicCollection", { defaultValue: "{{name}}'s Collection", name: profile.name })
                : "ModelHero"}
            </h1>
          </div>
          <a href={getRegisterPath(i18n.language)} data-testid="button-public-register">
            <Button size="sm" className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-white/20 border">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auth.createAccount", { defaultValue: "Create Account" })}</span>
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Mobile layout: single column, specific order */}
        <div className="lg:hidden space-y-6">
          {kitInfoCard}
          {hoursCard}
          {boxImageCard}
          {notesCard}
          {paintsCard}
          {buildPhotosCard}
          {referencesCard}
        </div>

        {/* Desktop layout: 2-column grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {boxImageCard}
            {notesCard}
            {paintsCard}
            {buildPhotosCard}
            {referencesCard}
          </div>
          <div className="space-y-4">
            {kitInfoCard}
            {hoursCard}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground" data-testid="footer-powered-by">
          Powered by{" "}
          <a
            href={homeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
            data-testid="link-modelhero-home"
          >
            ModelHero
          </a>
        </div>
      </footer>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/95 border-none"
          data-testid="public-photo-gallery-modal"
        >
          <div className="relative flex flex-col items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setGalleryOpen(false)}
              data-testid="button-close-gallery"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh] w-full px-4 pt-4 pb-2">
              {galleryPhotos[galleryIndex] && (
                <img
                  src={galleryPhotos[galleryIndex].url}
                  alt={galleryPhotos[galleryIndex].name}
                  className="max-w-full max-h-[75vh] object-contain"
                  data-testid="img-gallery-current"
                />
              )}
            </div>

            {galleryPhotos.length > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handlePrevGallery}
                  disabled={galleryIndex === 0}
                  data-testid="button-gallery-prev"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm tabular-nums">
                  {galleryIndex + 1} / {galleryPhotos.length}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleNextGallery}
                  disabled={galleryIndex === galleryPhotos.length - 1}
                  data-testid="button-gallery-next"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
