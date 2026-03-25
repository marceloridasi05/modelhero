import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, ArrowRight, ChevronDown } from "lucide-react";

const SCALES = [
  { value: "6", label: "1/6" },
  { value: "12", label: "1/12" },
  { value: "24", label: "1/24" },
  { value: "32", label: "1/32" },
  { value: "35", label: "1/35" },
  { value: "48", label: "1/48" },
  { value: "50", label: "1/50" },
  { value: "72", label: "1/72" },
  { value: "100", label: "1/100" },
  { value: "144", label: "1/144" },
  { value: "350", label: "1/350" },
  { value: "700", label: "1/700" },
];

interface ScaleConverterProps {
  defaultCollapsed?: boolean;
}

export default function ScaleConverter({ defaultCollapsed = false }: ScaleConverterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [inputValue, setInputValue] = useState("");
  const [fromScale, setFromScale] = useState("72");
  const [toScale, setToScale] = useState("48");
  const [result, setResult] = useState<number | null>(null);

  const handleConvert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) {
      setResult(null);
      return;
    }

    const from = parseInt(fromScale);
    const to = parseInt(toScale);
    
    const convertedValue = value * (from / to);
    setResult(Math.round(convertedValue * 1000) / 1000);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover-elevate">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5" />
              {t("home.scaleConverter.title")}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
        <div className="flex flex-col md:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Label htmlFor="scale-value" className="text-sm text-muted-foreground">
              {t("home.scaleConverter.measureLabel")}
            </Label>
            <Input
              id="scale-value"
              type="number"
              step="any"
              min="0"
              placeholder={t("home.scaleConverter.placeholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              data-testid="input-scale-value"
            />
          </div>
          
          <div className="flex-1 w-full">
            <Label htmlFor="from-scale" className="text-sm text-muted-foreground">
              {t("home.scaleConverter.currentScale")}
            </Label>
            <Select value={fromScale} onValueChange={setFromScale}>
              <SelectTrigger id="from-scale" data-testid="select-from-scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALES.map((scale) => (
                  <SelectItem key={scale.value} value={scale.value}>
                    {scale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ArrowRight className="hidden md:block w-5 h-5 text-muted-foreground flex-shrink-0" />

          <div className="flex-1 w-full">
            <Label htmlFor="to-scale" className="text-sm text-muted-foreground">
              {t("home.scaleConverter.convertTo")}
            </Label>
            <Select value={toScale} onValueChange={setToScale}>
              <SelectTrigger id="to-scale" data-testid="select-to-scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALES.map((scale) => (
                  <SelectItem key={scale.value} value={scale.value}>
                    {scale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleConvert}
            className="w-full md:w-auto text-white border-[#D25E37]"
            style={{ backgroundColor: "#D25E37" }}
            data-testid="button-convert-scale"
          >
            {t("home.scaleConverter.convert")}
          </Button>
        </div>

        {result !== null && (
          <div className="mt-4 p-3 rounded-md bg-muted/50 border">
            <p className="text-sm text-muted-foreground">{t("home.scaleConverter.result")}:</p>
            <p className="text-xl font-semibold" data-testid="text-scale-result">
              {inputValue} {t("home.scaleConverter.inScale")} 1/{fromScale} = <span className="text-primary">{result}</span> {t("home.scaleConverter.inScale")} 1/{toScale}
            </p>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
