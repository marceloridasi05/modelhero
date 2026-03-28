import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

const KIT_TYPE_KEYS: Record<string, string> = {
  "Avião": "airplane", "Helicóptero": "helicopter", "Militaria": "military",
  "Veículo": "vehicle", "Navio": "ship", "Submarino": "submarine",
  "Figura": "figure", "Diorama": "diorama", "Sci-Fi": "scifi", "Outro": "other",
};
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, PlayCircle, Camera, Loader2, CheckCircle2, Upload, ImageIcon, Flame, Check, Lightbulb, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import KitCard from "@/components/KitCard";
import { Card, CardContent } from "@/components/ui/card";
import KitForm from "@/components/KitForm";
import UpgradeModal from "@/components/UpgradeModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Kit } from "@/components/KitCard";

interface UsageData {
  kitsCount: number;
  materialsCount: number;
  wishlistCount: number;
  totalCount: number;
  limit: number;
  hasUnlimitedAccess: boolean;
  canAddItem: boolean;
  canExport: boolean;
}

interface EmAndamentoProps {
  kits: Kit[];
  onAddKit: (kit: Omit<Kit, "id">) => void;
  onEditKit: (kit: Kit) => void;
  isSavingKit?: boolean;
}

export default function EmAndamento({ kits, onAddKit, onEditKit, isSavingKit }: EmAndamentoProps) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  const [boxScanDialogOpen, setBoxScanDialogOpen] = useState(false);
  const [boxScanLoading, setBoxScanLoading] = useState(false);
  const [boxPhotoPreview, setBoxPhotoPreview] = useState<string | null>(null);
  const [boxScanResults, setBoxScanResults] = useState<{
    kits: { name: string; brand: string; scale: string; type: string }[];
    notes: string;
    createdKits: Kit[];
  } | null>(null);
  const boxPhotoCameraRef = useRef<HTMLInputElement>(null);
  const boxPhotoGalleryRef = useRef<HTMLInputElement>(null);

  const inProgressKits = kits.filter((k) => k.status === "em_andamento");

  const handleSave = (kit: Omit<Kit, "id"> & { id?: string }) => {
    if (kit.id) {
      onEditKit(kit as Kit);
    } else {
      onAddKit(kit);
    }
    setEditingKit(null);
  };

  const handleBoxPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Raw = reader.result as string;
      const { rotateToLandscape } = await import("@/lib/imageUtils");
      const base64 = await rotateToLandscape(base64Raw);
      setBoxPhotoPreview(base64);
      setBoxScanDialogOpen(true);
      setBoxScanLoading(true);
      setBoxScanResults(null);

      try {
        const response = await fetch("/api/ai/extract-kit-from-box", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: base64 }),
        });

        if (response.ok) {
          const data = await response.json();
          setBoxScanResults(data);
          
          if (data.createdKits && data.createdKits.length > 0) {
            queryClient.refetchQueries({ queryKey: ["/api/kits"] });
            toast({
              title: t("home.boxScan.successToast"),
              description: t("home.boxScan.successDescription", { count: data.createdKits.length }),
            });
          }
        } else {
          toast({
            title: t("common.error"),
            description: t("home.boxScan.errorAnalyzing"),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Box scan error:", error);
        toast({
          title: t("common.error"),
          description: t("home.boxScan.errorProcessing"),
          variant: "destructive",
        });
      } finally {
        setBoxScanLoading(false);
      }
    };
    reader.readAsDataURL(file);
    
    if (boxPhotoCameraRef.current) {
      boxPhotoCameraRef.current.value = "";
    }
    if (boxPhotoGalleryRef.current) {
      boxPhotoGalleryRef.current.value = "";
    }
  };

  const handleCloseBoxScanDialog = () => {
    setBoxScanDialogOpen(false);
    setBoxPhotoPreview(null);
    setBoxScanResults(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6" data-testid="page-em-andamento">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/70" data-testid="workbench-routine-tip">
        <Wrench className="w-3.5 h-3.5" />
        <span>{t("inProgress.routineTip")}</span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-accent" />
            {t("inProgress.title")}
          </h1>
          <p className="text-muted-foreground">
            {t(inProgressKits.length !== 1 ? "inProgress.subtitle_plural" : "inProgress.subtitle", { count: inProgressKits.length })}
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => {
            if (usage && !usage.canAddItem) {
              setUpgradeModalOpen(true);
            } else {
              setFormOpen(true);
            }
          }}
          data-testid="button-new-kit-progress"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("inProgress.newKitInProgress")}
        </Button>
      </div>

      {inProgressKits.length === 1 && (
        <Card className="border-accent/30 bg-accent/5" data-testid="card-habit-reinforcement">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Flame className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t("inProgress.habitState.title")}</p>
                <p className="text-sm text-muted-foreground">{t("inProgress.habitState.description")}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    {t("inProgress.habitState.benefit1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    {t("inProgress.habitState.benefit2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    {t("inProgress.habitState.benefit3")}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {inProgressKits.length >= 2 && (
        <Card className="border-muted bg-muted/20" data-testid="card-organization-tip">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("inProgress.engagedState.title")}</p>
                <p className="text-sm text-muted-foreground">{t("inProgress.engagedState.tip")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {inProgressKits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inProgressKits.map((kit) => (
            <KitCard 
              key={kit.id} 
              kit={kit} 
              onEdit={(k) => {
                setEditingKit(k);
                setFormOpen(true);
              }}
              showUpdateProgressButton={inProgressKits.length === 1}
              isWorkbench={true}
            />
          ))}
          {inProgressKits.length < 3 && (
            <>
              {inProgressKits.length < 1 && (
                <Card className="border-dashed bg-muted/30" data-testid="placeholder-first-progress">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <PlayCircle className="w-10 h-10 mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">{t("inProgress.placeholder.first")}</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (usage && !usage.canAddItem) {
                          setUpgradeModalOpen(true);
                        } else {
                          setFormOpen(true);
                        }
                      }} 
                      data-testid="button-placeholder-first-progress"
                    >
                      {t("inProgress.placeholder.cta")}
                    </Button>
                  </CardContent>
                </Card>
              )}
              {inProgressKits.length < 2 && (
                <Card className="border-dashed bg-muted/30" data-testid="placeholder-second-progress">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <PlayCircle className="w-10 h-10 mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">{t("inProgress.placeholder.second")}</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (usage && !usage.canAddItem) {
                          setUpgradeModalOpen(true);
                        } else {
                          setFormOpen(true);
                        }
                      }} 
                      data-testid="button-placeholder-second-progress"
                    >
                      {t("inProgress.placeholder.cta")}
                    </Button>
                  </CardContent>
                </Card>
              )}
              {inProgressKits.length < 3 && (
                <Card className="border-dashed bg-muted/30" data-testid="placeholder-third-progress">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <PlayCircle className="w-10 h-10 mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">{t("inProgress.placeholder.third")}</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (usage && !usage.canAddItem) {
                          setUpgradeModalOpen(true);
                        } else {
                          setFormOpen(true);
                        }
                      }} 
                      data-testid="button-placeholder-third-progress"
                    >
                      {t("inProgress.placeholder.cta")}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-16 max-w-md mx-auto">
          <PlayCircle className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-3">{t("inProgress.emptyState.title")}</h2>
          <p className="text-muted-foreground mb-6 whitespace-pre-line">
            {t("inProgress.emptyState.description")}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                if (usage && !usage.canAddItem) {
                  setUpgradeModalOpen(true);
                } else {
                  setFormOpen(true);
                }
              }}
              data-testid="button-empty-start-kit"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {t("inProgress.emptyState.primaryCta")}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              asChild
              data-testid="button-empty-choose-kit"
            >
              <Link href="/kits">
                {t("inProgress.emptyState.secondaryCta")}
              </Link>
            </Button>
          </div>
        </div>
      )}

      <KitForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kit={editingKit}
        onSave={handleSave}
        defaultStatus="em_andamento"
        isSaving={isSavingKit}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />

      <Dialog open={boxScanDialogOpen} onOpenChange={handleCloseBoxScanDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="box-scan-dialog-progress">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent" />
              {t("home.boxScan.title")}
            </DialogTitle>
            <DialogDescription>
              {t("home.boxScan.description")}
            </DialogDescription>
          </DialogHeader>

          {boxPhotoPreview && (
            <div className="mb-4">
              <img 
                src={boxPhotoPreview} 
                alt={t("kitDetail.boxImage.boxAlt")} 
                className="w-full max-h-48 object-contain rounded-md bg-muted"
              />
            </div>
          )}

          {boxScanLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <p className="text-muted-foreground text-center">
                {t("home.boxScan.analyzing")}
              </p>
            </div>
          ) : boxScanResults ? (
            <div className="space-y-4">
              {boxScanResults.createdKits && boxScanResults.createdKits.length > 0 ? (
                <>
                  <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {t("home.boxScan.kitsRegistered", { count: boxScanResults.createdKits.length })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("home.boxScan.kitsAddedSuccess")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">{t("home.boxScan.kitsIdentified")}</h4>
                    {boxScanResults.createdKits.map((kit, index) => (
                      <div 
                        key={kit.id || index} 
                        className="p-3 rounded-md bg-muted/50 border"
                        data-testid={`scanned-kit-progress-${index}`}
                      >
                        <p className="font-medium">{kit.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {kit.brand} - {kit.scale} - {KIT_TYPE_KEYS[kit.type] ? t(`kitForm.types.${KIT_TYPE_KEYS[kit.type]}`) : kit.type}
                        </p>
                      </div>
                    ))}
                  </div>

                  {boxScanResults.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      {boxScanResults.notes}
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-md bg-muted/50 text-center">
                  <p className="text-muted-foreground">
                    {t("home.boxScan.noKitsFound")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("home.boxScan.tryBetterPhoto")}
                  </p>
                </div>
              )}
            </div>
          ) : null}
          
          <DialogFooter>
            {boxScanResults?.createdKits && boxScanResults.createdKits.length > 0 ? (
              <Button onClick={handleCloseBoxScanDialog} data-testid="button-close-scan-progress">
                {t("home.boxScan.close")}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseBoxScanDialog}>
                  {t("home.boxScan.close")}
                </Button>
                <Button onClick={() => boxPhotoCameraRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("home.boxScan.tryAnotherPhoto")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
