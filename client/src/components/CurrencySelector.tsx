import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/contexts/CurrencyContext";

export default function CurrencySelector() {
  const { preferredCurrency, setPreferredCurrency, isLoadingRates } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isLoadingRates}>
        <Button variant="ghost" size="icon" data-testid="button-currency-selector">
          <DollarSign className="h-5 w-5 text-white md:text-foreground" />
          <span className="sr-only">Select currency</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_CURRENCIES.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => setPreferredCurrency(currency.code as CurrencyCode)}
            className={preferredCurrency === currency.code ? 'bg-accent' : ''}
            data-testid={`menu-item-currency-${currency.code}`}
          >
            <span className="mr-2 text-xs font-semibold text-muted-foreground w-10">{currency.code}</span>
            {currency.symbol}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
