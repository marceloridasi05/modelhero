import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export const SUPPORTED_CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" },
  { code: "JPY", symbol: "¥", name: "Iene Japonês" },
  { code: "AUD", symbol: "A$", name: "Dólar Australiano" },
  { code: "CAD", symbol: "C$", name: "Dólar Canadense" },
  { code: "CHF", symbol: "Fr", name: "Franco Suíço" },
  { code: "CNY", symbol: "¥", name: "Yuan Chinês" },
  { code: "ARS", symbol: "$", name: "Peso Argentino" },
  { code: "MXN", symbol: "$", name: "Peso Mexicano" },
  { code: "CLP", symbol: "$", name: "Peso Chileno" },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]["code"];

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  preferredCurrency: CurrencyCode;
  setPreferredCurrency: (currency: CurrencyCode) => void;
  exchangeRates: ExchangeRates;
  isLoadingRates: boolean;
  convert: (amount: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode) => number;
  formatCurrency: (amount: number, currency?: CurrencyCode) => string;
  getCurrencySymbol: (currency: CurrencyCode) => string;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: CurrencyCode;
}

export function CurrencyProvider({ children, defaultCurrency }: CurrencyProviderProps) {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const { data: userData } = useQuery<{ preferredCurrency?: string }>({
    queryKey: ["/api/auth/me"],
  });

  const preferredCurrency = defaultCurrency || (userData?.preferredCurrency as CurrencyCode) || "BRL";

  const updatePreferredCurrencyMutation = useMutation({
    mutationFn: async (currency: CurrencyCode) => {
      const response = await apiRequest("PATCH", "/api/user/preferred-currency", { currency });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const setPreferredCurrency = useCallback((currency: CurrencyCode) => {
    updatePreferredCurrencyMutation.mutate(currency);
  }, [updatePreferredCurrencyMutation]);

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        const cachedRates = localStorage.getItem("exchangeRates");
        const cachedTime = localStorage.getItem("exchangeRatesTime");
        
        if (cachedRates && cachedTime) {
          const timeDiff = Date.now() - parseInt(cachedTime);
          if (timeDiff < 6 * 60 * 60 * 1000) {
            setExchangeRates(JSON.parse(cachedRates));
            setLastUpdated(new Date(parseInt(cachedTime)));
            setIsLoadingRates(false);
            return;
          }
        }

        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR");
        if (response.ok) {
          const data = await response.json();
          const rates: ExchangeRates = { EUR: 1, ...data.rates };
          setExchangeRates(rates);
          setLastUpdated(new Date());
          localStorage.setItem("exchangeRates", JSON.stringify(rates));
          localStorage.setItem("exchangeRatesTime", Date.now().toString());
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        const cachedRates = localStorage.getItem("exchangeRates");
        if (cachedRates) {
          setExchangeRates(JSON.parse(cachedRates));
        }
      }
      setIsLoadingRates(false);
    };

    fetchRates();
    const interval = setInterval(fetchRates, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const convert = useCallback((amount: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode): number => {
    const targetCurrency = toCurrency || preferredCurrency;
    if (fromCurrency === targetCurrency) return amount;
    
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[targetCurrency];
    
    if (!fromRate || !toRate) return amount;
    
    const eurAmount = amount / fromRate;
    return eurAmount * toRate;
  }, [exchangeRates, preferredCurrency]);

  const getCurrencySymbol = useCallback((currency: CurrencyCode): string => {
    const curr = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    return curr?.symbol || currency;
  }, []);

  const formatCurrency = useCallback((amount: number, currency?: CurrencyCode): string => {
    const curr = currency || preferredCurrency;
    const symbol = getCurrencySymbol(curr);
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${symbol} ${formatted}`;
  }, [preferredCurrency, getCurrencySymbol]);

  return (
    <CurrencyContext.Provider
      value={{
        preferredCurrency,
        setPreferredCurrency,
        exchangeRates,
        isLoadingRates,
        convert,
        formatCurrency,
        getCurrencySymbol,
        lastUpdated,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
