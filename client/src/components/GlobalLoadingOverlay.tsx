import { createContext, useContext, useState, type ReactNode } from "react";
import { Cog } from "lucide-react";

interface GlobalLoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(null);

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within GlobalLoadingProvider");
  }
  return context;
}

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Carregando...");

  const showLoading = (msg: string = "Carregando...") => {
    setMessage(msg);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, message, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center"
          data-testid="global-loading-overlay"
        >
          <Cog className="w-20 h-20 text-primary animate-spin" />
          <p className="mt-4 text-xl font-medium text-foreground">{message}</p>
        </div>
      )}
    </GlobalLoadingContext.Provider>
  );
}
