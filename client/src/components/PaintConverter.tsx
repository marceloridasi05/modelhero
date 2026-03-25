import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, Search, X, Plane, ChevronDown } from "lucide-react";
import { 
  searchPaintConversions, 
  findByFsCode, 
  findByRalCode, 
  findByRlmCode,
  searchCamouflageSchemes,
  FS_CODES_LIST,
  RAL_CODES_LIST,
  RLM_CODES_LIST,
  US_CAMOUFLAGE_SCHEMES,
  type PaintConversion,
  type CamouflageScheme
} from "@/lib/paintConversions";
import { findPaintsByFsCode, type PaintCode } from "@/lib/paintCodes";

type SearchMode = "text" | "fs" | "ral" | "rlm" | "camo";

interface DatabasePaint {
  brand: string;
  paint: PaintCode;
}

interface SearchResult {
  conversion: PaintConversion | null;
  databasePaints: DatabasePaint[];
}

interface PaintConverterProps {
  defaultCollapsed?: boolean;
}

export default function PaintConverter({ defaultCollapsed = false }: PaintConverterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [searchMode, setSearchMode] = useState<SearchMode>("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [camoResults, setCamoResults] = useState<CamouflageScheme[]>([]);

  const handleSearch = () => {
    if (searchMode === "camo") {
      const schemes = searchCamouflageSchemes(searchQuery);
      setCamoResults(schemes);
      setResults([]);
      return;
    }
    
    const searchResults: SearchResult[] = [];
    
    if (searchMode === "text" && searchQuery.trim()) {
      const conversions = searchPaintConversions(searchQuery);
      conversions.forEach(conv => {
        const dbPaints = conv.fsCode ? findPaintsByFsCode(conv.fsCode) : [];
        searchResults.push({ conversion: conv, databasePaints: dbPaints });
      });
    } else if (searchMode === "fs" && selectedCode) {
      const conversion = findByFsCode(selectedCode);
      const dbPaints = findPaintsByFsCode(selectedCode);
      if (conversion || dbPaints.length > 0) {
        searchResults.push({ conversion: conversion || null, databasePaints: dbPaints });
      }
    } else if (searchMode === "ral" && selectedCode) {
      const conversions = findByRalCode(selectedCode);
      conversions.forEach(conv => {
        const dbPaints = conv.fsCode ? findPaintsByFsCode(conv.fsCode) : [];
        searchResults.push({ conversion: conv, databasePaints: dbPaints });
      });
    } else if (searchMode === "rlm" && selectedCode) {
      const conversions = findByRlmCode(selectedCode);
      conversions.forEach(conv => {
        const dbPaints = conv.fsCode ? findPaintsByFsCode(conv.fsCode) : [];
        searchResults.push({ conversion: conv, databasePaints: dbPaints });
      });
    }
    
    setResults(searchResults);
    setCamoResults([]);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchQuery("");
    setSelectedCode("");
    setResults([]);
    setCamoResults([]);
    if (mode === "camo") {
      setCamoResults(US_CAMOUFLAGE_SCHEMES);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedCode("");
    setResults([]);
    setCamoResults([]);
  };

  const handleFsCodeClick = (fsCode: string) => {
    setSearchMode("fs");
    setSelectedCode(fsCode);
    setSearchQuery("");
    setCamoResults([]);
    
    const conversion = findByFsCode(fsCode);
    const dbPaints = findPaintsByFsCode(fsCode);
    const searchResults: SearchResult[] = [];
    if (conversion || dbPaints.length > 0) {
      searchResults.push({ conversion: conversion || null, databasePaints: dbPaints });
    }
    setResults(searchResults);
  };

  const filteredFsCodes = useMemo(() => {
    if (!searchQuery) return FS_CODES_LIST.slice(0, 50);
    const q = searchQuery.toLowerCase();
    return FS_CODES_LIST.filter(c => 
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [searchQuery]);

  const filteredRalCodes = useMemo(() => {
    if (!searchQuery) return RAL_CODES_LIST;
    const q = searchQuery.toLowerCase();
    return RAL_CODES_LIST.filter(c => 
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredRlmCodes = useMemo(() => {
    if (!searchQuery) return RLM_CODES_LIST;
    const q = searchQuery.toLowerCase();
    return RLM_CODES_LIST.filter(c => 
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover-elevate">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-accent" />
              {t("home.paintConverter.title")}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={searchMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("text")}
            data-testid="button-search-text"
          >
            {t("home.paintConverter.freeSearch")}
          </Button>
          <Button
            variant={searchMode === "fs" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("fs")}
            data-testid="button-search-fs"
          >
            {t("home.paintConverter.fsCode")}
          </Button>
          <Button
            variant={searchMode === "ral" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("ral")}
            data-testid="button-search-ral"
          >
            {t("home.paintConverter.ralCode")}
          </Button>
          <Button
            variant={searchMode === "rlm" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("rlm")}
            data-testid="button-search-rlm"
          >
            {t("home.paintConverter.rlmCode")}
          </Button>
          <Button
            variant={searchMode === "camo" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("camo")}
            data-testid="button-search-camo"
          >
            <Plane className="w-4 h-4 mr-1" />
            {t("home.paintConverter.usafCamo")}
          </Button>
        </div>

        <div className="flex gap-2">
          {searchMode === "text" ? (
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t("home.paintConverter.searchDescription")}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("home.paintConverter.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-paint-search"
                />
                {searchQuery && (
                  <Button variant="ghost" size="icon" onClick={handleClear}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  onClick={handleSearch} 
                  className="text-white border-[#D25E37]"
                  style={{ backgroundColor: "#D25E37" }}
                  data-testid="button-paint-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t("common.search")}
                </Button>
              </div>
            </div>
          ) : searchMode === "fs" ? (
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t("home.paintConverter.selectFsCode")}
              </Label>
              <div className="flex gap-2">
                <Select value={selectedCode} onValueChange={setSelectedCode}>
                  <SelectTrigger className="flex-1" data-testid="select-fs-code">
                    <SelectValue placeholder={t("home.paintConverter.chooseFsCode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder={t("home.paintConverter.filterCodes")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <ScrollArea className="h-60">
                      {filteredFsCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          FS {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch} 
                  className="text-white border-[#D25E37]"
                  style={{ backgroundColor: "#D25E37" }}
                  data-testid="button-fs-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t("common.search")}
                </Button>
              </div>
            </div>
          ) : searchMode === "ral" ? (
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t("home.paintConverter.selectRalCode")}
              </Label>
              <div className="flex gap-2">
                <Select value={selectedCode} onValueChange={setSelectedCode}>
                  <SelectTrigger className="flex-1" data-testid="select-ral-code">
                    <SelectValue placeholder={t("home.paintConverter.chooseRalCode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder={t("home.paintConverter.filterCodes")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <ScrollArea className="h-60">
                      {filteredRalCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          RAL {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch} 
                  className="text-white border-[#D25E37]"
                  style={{ backgroundColor: "#D25E37" }}
                  data-testid="button-ral-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t("common.search")}
                </Button>
              </div>
            </div>
          ) : searchMode === "rlm" ? (
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t("home.paintConverter.selectRlmCode")}
              </Label>
              <div className="flex gap-2">
                <Select value={selectedCode} onValueChange={setSelectedCode}>
                  <SelectTrigger className="flex-1" data-testid="select-rlm-code">
                    <SelectValue placeholder={t("home.paintConverter.chooseRlmCode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder={t("home.paintConverter.filterCodes")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    <ScrollArea className="h-60">
                      {filteredRlmCodes.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          RLM {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch} 
                  className="text-white border-[#D25E37]"
                  style={{ backgroundColor: "#D25E37" }}
                  data-testid="button-rlm-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {t("common.search")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t("home.paintConverter.camoSearchDescription")}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("home.paintConverter.camoSearchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCamoResults(searchCamouflageSchemes(e.target.value));
                  }}
                  data-testid="input-camo-search"
                />
                {searchQuery && (
                  <Button variant="ghost" size="icon" onClick={handleClear}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {camoResults.length > 0 && searchMode === "camo" && (
          <div className="space-y-3 pt-2">
            <div className="text-sm text-muted-foreground">
              {t("home.paintConverter.schemesFound", { count: camoResults.length })}
            </div>
            <ScrollArea className="h-80">
              <div className="space-y-3 pr-4">
                {camoResults.map((scheme, index) => (
                  <CamoSchemeCard key={`${scheme.name}-${index}`} scheme={scheme} onFsCodeClick={handleFsCodeClick} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-sm text-muted-foreground">
              {t("home.paintConverter.resultsFound", { count: results.length })}
            </div>
            <div className="space-y-3">
              {results.map((result, index) => (
                <PaintResultCard 
                  key={`${result.conversion?.fsCode || result.conversion?.ralCode || index}`} 
                  result={result} 
                />
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && (searchQuery || selectedCode) && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t("home.paintConverter.clickToSearch")}
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function PaintResultCard({ result }: { result: SearchResult }) {
  const { t } = useTranslation();
  const { conversion, databasePaints } = result;

  const brandColors: Record<string, string> = {
    "Tamiya": "#ce0000",
    "AK Interactive": "#b30000",
    "Ammo by Mig Jimenez": "#ff6600",
    "Vallejo Model Air": "#1a4d1a",
    "Vallejo Model Color": "#1a4d1a",
    "Vallejo": "#1a4d1a",
    "Revell Color": "#1a1a8c",
    "Revell": "#1a1a8c",
    "Mr. Aqueous Hobby Color": "#e67300",
    "Mr. Hobby": "#e67300",
    "Mr.COLOR": "#e67300",
    "Italeri Acrylic Paint": "#006699",
    "Italeri": "#006699",
    "Model Master": "#666666",
    "Humbrol": "#00529c",
    "Lifecolor": "#996633",
    "Hataka Hobby Blue Line": "#0066cc",
    "Hataka Hobby Orange Line": "#ff6600",
    "Hataka Hobby Red Line": "#cc0000",
    "Hataka": "#4a4a4a",
    "Talento": "#4a9c4a",
    "Hobby Cores": "#6b9f3d",
    "ATOM": "#2e86ab",
    "MR.Paint": "#8b0000",
    "Alclad II": "#c0c0c0",
    "Zvezda": "#cc0000",
  };

  const allBrands = useMemo(() => {
    const brands: Record<string, string[]> = {};
    
    if (conversion) {
      if (conversion.tamiya?.length) brands["Tamiya"] = [...conversion.tamiya];
      if (conversion.humbrol?.length) brands["Humbrol"] = [...conversion.humbrol];
      if (conversion.gunze?.length) brands["Mr. Hobby"] = [...conversion.gunze];
      if (conversion.revell?.length) brands["Revell"] = [...conversion.revell];
      if (conversion.akInteractive?.length) brands["AK Interactive"] = [...conversion.akInteractive];
      if (conversion.vallejo?.length) brands["Vallejo"] = [...conversion.vallejo];
      if (conversion.italeri?.length) brands["Italeri"] = [...conversion.italeri];
      if (conversion.modelMaster?.length) brands["Model Master"] = [...conversion.modelMaster];
      if (conversion.lifecolor?.length) brands["Lifecolor"] = [...conversion.lifecolor];
      if (conversion.hataka?.length) brands["Hataka"] = [...conversion.hataka];
      if (conversion.hobbyCores?.length) brands["Hobby Cores"] = [...conversion.hobbyCores];
      if (conversion.mrColor?.length) brands["Mr.COLOR"] = [...conversion.mrColor];
      if (conversion.atom?.length) brands["ATOM"] = [...conversion.atom];
      if (conversion.mrPaint?.length) brands["MR.Paint"] = [...conversion.mrPaint];
      if (conversion.alcladII?.length) brands["Alclad II"] = [...conversion.alcladII];
    }
    
    databasePaints.forEach(({ brand, paint }) => {
      const code = paint.code;
      if (!brands[brand]) {
        brands[brand] = [];
      }
      if (!brands[brand].includes(code)) {
        brands[brand].push(code);
      }
    });
    
    return brands;
  }, [conversion, databasePaints]);

  const brandOrder = [
    "Tamiya", "Humbrol", "Mr. Hobby", "Revell", "AK Interactive", 
    "Ammo by Mig Jimenez", "Vallejo", "Vallejo Model Air", "Vallejo Model Color",
    "Italeri", "Italeri Acrylic Paint", "Model Master", "Lifecolor", 
    "Hataka", "Hataka Hobby Blue Line", "Hataka Hobby Orange Line", "Hataka Hobby Red Line",
    "Mr. Aqueous Hobby Color", "Mr.COLOR", "MR.Paint", "Revell Color", "Talento", "Hobby Cores", "ATOM", "Zvezda"
  ];

  const sortedBrands = Object.entries(allBrands).sort((a, b) => {
    const indexA = brandOrder.indexOf(a[0]);
    const indexB = brandOrder.indexOf(b[0]);
    if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div 
      className="p-4 rounded-md border bg-muted/30"
      data-testid={`paint-result-${conversion?.fsCode || conversion?.ralCode || 'db'}`}
    >
      {conversion && (
        <div className="flex items-start gap-3 mb-3">
          {conversion.hexColor && (
            <div 
              className="w-10 h-10 rounded-md border shadow-sm flex-shrink-0"
              style={{ backgroundColor: conversion.hexColor }}
              title={conversion.hexColor}
            />
          )}
          <div>
            <div className="font-medium">{conversion.colorName}</div>
            <div className="flex gap-1 flex-wrap mt-1">
              {conversion.fsCode && (
                <Badge variant="secondary" className="text-xs">FS {conversion.fsCode}</Badge>
              )}
              {conversion.ralCode && (
                <Badge variant="outline" className="text-xs">RAL {conversion.ralCode}</Badge>
              )}
              {conversion.rlmCode && (
                <Badge variant="outline" className="text-xs">RLM {conversion.rlmCode}</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {sortedBrands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {sortedBrands.map(([brand, codes]) => (
            <div key={brand} className="flex items-center gap-2">
              <span 
                className="font-medium min-w-28" 
                style={{ color: brandColors[brand] || "#666666" }}
              >
                {brand}:
              </span>
              <span className="text-muted-foreground">{codes.join(", ")}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-2">
          {t("home.paintConverter.noResults")}
        </div>
      )}
    </div>
  );
}

function PaintBrandRow({ brand, codes, color }: { brand: string; codes: string[]; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium min-w-24" style={{ color }}>{brand}:</span>
      <span className="text-muted-foreground">{codes.join(", ")}</span>
    </div>
  );
}

function CamoSchemeCard({ scheme, onFsCodeClick }: { scheme: CamouflageScheme; onFsCodeClick: (fsCode: string) => void }) {
  const { t } = useTranslation();
  
  return (
    <div 
      className="p-4 rounded-md border bg-muted/30"
      data-testid={`camo-scheme-${scheme.name.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex gap-1 flex-shrink-0">
          {scheme.fsCodes.slice(0, 4).map((code) => (
            <button 
              key={code}
              className="w-6 h-6 rounded-sm border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all"
              style={{ backgroundColor: getFsColor(code) }}
              title={`${t("home.paintConverter.clickToViewPaints", "Clique para ver tintas")} - FS ${code}`}
              onClick={() => onFsCodeClick(code)}
              data-testid={`fs-chip-${code}`}
            />
          ))}
        </div>
        <div className="flex-1">
          <div className="font-medium">{scheme.name}</div>
          {scheme.aircraft && (
            <div className="text-sm text-muted-foreground">{scheme.aircraft}</div>
          )}
        </div>
        <Badge variant="outline" className="text-xs flex-shrink-0">{scheme.period}</Badge>
      </div>
      
      {scheme.description && (
        <p className="text-sm text-muted-foreground mb-2">{scheme.description}</p>
      )}
      
      <div className="flex gap-1 flex-wrap">
        {scheme.fsCodes.map((code) => (
          <Badge 
            key={code} 
            variant="secondary" 
            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => onFsCodeClick(code)}
            data-testid={`fs-badge-${code}`}
          >
            FS {code}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function getFsColor(fsCode: string): string {
  const colorMap: Record<string, string> = {
    "30219": "#9a8b70", "34102": "#4a6a4a", "34079": "#4a5a4a", "36622": "#909090",
    "17038": "#0d0d0d", "34201": "#827660", "34159": "#6a7a5a", "17875": "#ffffff",
    "36118": "#4f5f6f", "34086": "#2f4f2f", "36081": "#4a4a4a", "34092": "#4a6a4a",
    "26173": "#5a5a6a", "20400": "#6b4423", "30140": "#5a4a3a", "30266": "#c4a060",
    "33722": "#c4a060", "35526": "#87ceeb", "26270": "#808080", "26118": "#4f5f6f",
    "36320": "#5a5a5a", "36492": "#7a7a8a", "36375": "#a8a8a8", "37176": "#a0a0a0",
    "36251": "#7a7a7a", "36231": "#5a6a6a", "16473": "#1a1a1a", "14064": "#2a5a4a",
    "16173": "#4a4a5a", "16440": "#a0a0a0", "34064": "#4a5a4a", "36099": "#5f6f6f",
    "36270": "#808080",
  };
  return colorMap[fsCode] || "#808080";
}
