import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Camera, Link, Search, Check, X, Loader2, Crown, Lock, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentInfo } from "@/lib/paymentInfo";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import AIUpgradeModal from "./AIUpgradeModal";
import type { User } from "@shared/schema";

interface DuplicateResult {
  kitId: string;
  kitName: string;
  itemType?: string;
  matchConfidence: number;
  matchReason: string;
}

interface ExtractedInfo {
  name?: string;
  brand?: string;
  scale?: string;
  kitNumber?: string;
  code?: string;
  type?: string;
}

interface CheckResult {
  extractedInfo?: ExtractedInfo | null;
  duplicates?: DuplicateResult[];
  recommendation?: string;
  message?: string;
}

interface DuplicateCheckerProps {
  defaultCollapsed?: boolean;
}

export default function DuplicateChecker({ defaultCollapsed = false }: DuplicateCheckerProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paymentInfo = getPaymentInfo(i18n.language);
  const { originalPrice, promoPrice, currency, link: upgradeLink, labelKey, useStripeCheckout, stripePriceId } = paymentInfo;
  
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });
  
  const isFreeUser = user?.status === 'free';

  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);

  const trackUpgradeClick = () => {
    apiRequest("POST", "/api/user/upgrade-click").catch(() => {});
  };

  const handleStripeCheckout = async () => {
    setIsUpgradeLoading(true);
    trackUpgradeClick();
    try {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {
        priceId: stripePriceId,
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsUpgradeLoading(false);
    }
  };
  
  const [activeTab, setActiveTab] = useState("photo");
  const [textQuery, setTextQuery] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDuplicateCheckUpgrade, setShowDuplicateCheckUpgrade] = useState(false);

  const getItemTypeLabel = (itemType?: string) => {
    if (!itemType) return "";
    const typeMap: Record<string, string> = {
      "kit": t("home.duplicateChecker.itemTypes.kit", "Kit"),
      "tintas": t("home.duplicateChecker.itemTypes.paint", "Tinta"),
      "insumos": t("home.duplicateChecker.itemTypes.supply", "Insumo"),
      "ferramentas": t("home.duplicateChecker.itemTypes.tool", "Ferramenta"),
      "decais": t("home.duplicateChecker.itemTypes.decal", "Decal"),
    };
    return typeMap[itemType.toLowerCase()] || itemType;
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      await checkDuplicate({ photoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const checkDuplicate = async (params: { photoUrl?: string; textQuery?: string; productUrl?: string }) => {
    setIsChecking(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/ai/check-duplicate", { ...params, language });
      
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.limitReached) {
          setShowDuplicateCheckUpgrade(true);
          return;
        }
      }
      
      const data = await response.json();
      setResult(data);

      if (data.duplicates && data.duplicates.length > 0) {
        toast({
          title: t("home.duplicateChecker.duplicatesFound", "Possíveis duplicatas encontradas!"),
          description: t("home.duplicateChecker.duplicatesFoundDesc", "Este produto pode já estar na sua coleção."),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("home.duplicateChecker.noDuplicates", "Nenhuma duplicata encontrada"),
          description: t("home.duplicateChecker.noDuplicatesDesc", "Este produto parece ser uma compra nova."),
        });
      }
    } catch (err: unknown) {
      console.error("Check duplicate error:", err);
      
      if (err instanceof Response && err.status === 403) {
        const errorData = await err.json().catch(() => ({}));
        if (errorData.limitReached) {
          setShowDuplicateCheckUpgrade(true);
          return;
        }
      }
      
      toast({
        title: t("errors.generic", "Erro"),
        description: t("home.duplicateChecker.checkError", "Erro ao verificar duplicidade. Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleTextSearch = async () => {
    if (!textQuery.trim()) return;
    await checkDuplicate({ textQuery: textQuery.trim() });
  };

  const handleUrlSearch = async () => {
    if (!productUrl.trim()) return;
    await checkDuplicate({ productUrl: productUrl.trim() });
  };

  const handleClear = () => {
    setResult(null);
    setPreviewImage(null);
    setTextQuery("");
    setProductUrl("");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-destructive text-destructive-foreground";
    if (confidence >= 0.5) return "bg-orange-500 text-white dark:bg-orange-600";
    return "bg-muted text-muted-foreground";
  };

  if (isFreeUser) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover-elevate">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-accent" />
                {t("home.duplicateChecker.title", "Detector de Duplicidade")}
                <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Full
                </Badge>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{t("home.duplicateChecker.premiumFeature", "Funcionalidade do Plano Full")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("home.duplicateChecker.premiumDescription", "O Detector de Duplicidade está disponível apenas para assinantes do plano Full. Evite comprar itens que você já possui!")}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-medium text-secondary">
                    {t(labelKey)}
                  </p>
                  <p className="text-lg font-bold text-secondary">
                    {originalPrice && (
                      <span className="text-sm line-through text-muted-foreground mr-2">{currency}{originalPrice}</span>
                    )}
                    {currency}{promoPrice}
                    <span className="text-xs font-normal text-muted-foreground">{t("upgrade.perMonth")}</span>
                  </p>
                </div>
                {useStripeCheckout ? (
                  <Button 
                    className="bg-secondary hover:bg-secondary/90 text-white"
                    onClick={handleStripeCheckout}
                    disabled={isUpgradeLoading}
                  >
                    {isUpgradeLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4 mr-2" />
                    )}
                    {isUpgradeLoading ? t("common.loading") : t("upgrade.doUpgrade")}
                  </Button>
                ) : (
                  <Button 
                    className="bg-secondary hover:bg-secondary/90 text-white"
                    asChild
                  >
                    <a href={upgradeLink} target="_blank" rel="noopener noreferrer" onClick={trackUpgradeClick}>
                      <Crown className="w-4 h-4 mr-2" />
                      {t("upgrade.doUpgrade")}
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover-elevate">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-accent" />
              {t("home.duplicateChecker.title", "Detector de Duplicidade")}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("home.duplicateChecker.description", "Verifique se um produto já está na sua coleção antes de comprar.")}
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo" className="flex items-center gap-1" data-testid="tab-photo">
              <Camera className="w-4 h-4" />
              {t("home.duplicateChecker.photo", "Foto")}
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1" data-testid="tab-text">
              <Search className="w-4 h-4" />
              {t("home.duplicateChecker.text", "Texto")}
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-1" data-testid="tab-url">
              <Link className="w-4 h-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="space-y-3 pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-photo-file"
            />
            
            {previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-40 object-cover rounded-md border"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={handleClear}
                  data-testid="button-clear-photo"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-24 flex flex-col gap-2"
                onClick={handlePhotoCapture}
                disabled={isChecking}
                data-testid="button-capture-photo"
              >
                <Camera className="w-6 h-6" />
                {t("home.duplicateChecker.takePhoto", "Tirar ou escolher foto")}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("home.duplicateChecker.textSearchDesc", "Digite o nome do produto, marca ou código")}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("home.duplicateChecker.textPlaceholder", "Ex: Tamiya F-15C 1/48, Revell 04291...")}
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
                  data-testid="input-text-query"
                />
                <Button 
                  onClick={handleTextSearch}
                  disabled={isChecking || !textQuery.trim()}
                  data-testid="button-text-search"
                >
                  {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("home.duplicateChecker.urlSearchDesc", "Cole a URL do produto de uma loja online")}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSearch()}
                  data-testid="input-product-url"
                />
                <Button 
                  onClick={handleUrlSearch}
                  disabled={isChecking || !productUrl.trim()}
                  data-testid="button-url-search"
                >
                  {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isChecking && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("home.duplicateChecker.checking", "Verificando duplicidade...")}
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-2">
            {result.extractedInfo && (
              <div className="p-3 rounded-md bg-muted/30 border">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  {t("home.duplicateChecker.identifiedProduct", "Produto identificado:")}
                  {result.extractedInfo.type && (
                    <Badge variant="secondary" className="text-xs">
                      {result.extractedInfo.type}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  {result.extractedInfo.name && (
                    <div><span className="text-muted-foreground">{t("kits.name", "Nome")}:</span> {result.extractedInfo.name}</div>
                  )}
                  {result.extractedInfo.brand && (
                    <div><span className="text-muted-foreground">{t("kits.brand", "Marca")}:</span> {result.extractedInfo.brand}</div>
                  )}
                  {result.extractedInfo.code && (
                    <div><span className="text-muted-foreground">{t("home.duplicateChecker.code", "Código")}:</span> {result.extractedInfo.code}</div>
                  )}
                  {result.extractedInfo.scale && (
                    <div><span className="text-muted-foreground">{t("kits.scale", "Escala")}:</span> {result.extractedInfo.scale}</div>
                  )}
                  {result.extractedInfo.kitNumber && (
                    <div><span className="text-muted-foreground">{t("kits.kitNumber", "Número")}:</span> {result.extractedInfo.kitNumber}</div>
                  )}
                </div>
              </div>
            )}

            {result.duplicates && result.duplicates.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  {t("home.duplicateChecker.duplicatesAlert", "Possíveis duplicatas na sua coleção:")}
                </div>
                {result.duplicates.map((dup, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-md border border-destructive/30 bg-destructive/5"
                    data-testid={`duplicate-item-${index}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dup.kitName}</span>
                        {dup.itemType && (
                          <Badge variant="outline" className="text-xs">
                            {getItemTypeLabel(dup.itemType)}
                          </Badge>
                        )}
                      </div>
                      <Badge className={getConfidenceColor(dup.matchConfidence)}>
                        {Math.round(dup.matchConfidence * 100)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {dup.matchReason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium">
                <Check className="w-4 h-4" />
                {t("home.duplicateChecker.noMatch", "Nenhuma duplicata encontrada na sua coleção")}
              </div>
            )}

            {result.recommendation && (
              <div className="p-3 rounded-md bg-accent/10 border border-accent/20 text-sm">
                {result.recommendation}
              </div>
            )}

            {result.message && !result.duplicates?.length && (
              <div className="text-sm text-muted-foreground text-center">
                {result.message}
              </div>
            )}
          </div>
        )}

        <AIUpgradeModal 
          open={showDuplicateCheckUpgrade} 
          onOpenChange={setShowDuplicateCheckUpgrade} 
          type="duplicateCheck" 
        />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
