import { createContext, useContext, useCallback } from 'react';

interface BuildPathOptions {
  absolute?: boolean;
}

interface BasePathContextType {
  basePath: string;
  buildPath: (path: string, options?: BuildPathOptions) => string;
}

const BasePathContext = createContext<BasePathContextType>({
  basePath: '',
  buildPath: (path: string) => path,
});

interface BasePathProviderProps {
  basePath?: string;
  children: React.ReactNode;
}

export function BasePathProvider({ basePath = '', children }: BasePathProviderProps) {
  const buildPath = useCallback((path: string, options?: BuildPathOptions) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    if (options?.absolute && basePath) {
      if (normalizedPath.startsWith(basePath)) {
        return normalizedPath;
      }
      return `${basePath}${normalizedPath}`;
    }
    
    return normalizedPath;
  }, [basePath]);

  return (
    <BasePathContext.Provider value={{ basePath, buildPath }}>
      {children}
    </BasePathContext.Provider>
  );
}

export function useBasePath() {
  return useContext(BasePathContext);
}
