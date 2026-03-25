import { createContext, useContext, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { SUPPORTED_LANGUAGES, LanguageCode, setLanguageImmediate } from '@/i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: LanguageCode;
}

export function LanguageProvider({ children, defaultLanguage }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (defaultLanguage) {
      return defaultLanguage;
    }
    const stored = localStorage.getItem('modelhero-language');
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored as LanguageCode;
    }
    return 'pt';
  });

  useLayoutEffect(() => {
    if (defaultLanguage) {
      setLanguageImmediate(defaultLanguage);
      i18n.changeLanguage(defaultLanguage);
      setLanguageState(defaultLanguage);
    }
  }, [defaultLanguage, i18n]);

  useEffect(() => {
    if (!defaultLanguage && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n, defaultLanguage]);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('modelhero-language', lang);
    i18n.changeLanguage(lang);
    
    try {
      await apiRequest('PATCH', '/api/user/preferred-language', { language: lang });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
    
    const currentPath = window.location.pathname;
    const isPublicOrAuthPage = currentPath === '/' || currentPath.match(/^\/(en|es|fr|ge|it|ru|jp)\/?$/) || currentPath.match(/^\/(login|register)/) || currentPath.match(/^\/(en|es|fr|ge|it|ru|jp)\/(login|register)/);

    if (isPublicOrAuthPage) {
      const languageRoutes: Record<string, string> = {
        'en': '/en',
        'es': '/es',
        'fr': '/fr',
        'de': '/ge',
        'it': '/it',
        'ru': '/ru',
        'ja': '/jp',
      };

      const langPrefixMatch = currentPath.match(/^\/(en|es|fr|ge|it|ru|jp)(\/.*)?$/);
      const pathWithoutLangPrefix = langPrefixMatch ? (langPrefixMatch[2] || '/') : currentPath;

      if (lang === 'pt') {
        window.location.href = pathWithoutLangPrefix;
      } else if (languageRoutes[lang]) {
        window.location.href = languageRoutes[lang] + pathWithoutLangPrefix;
      }
    }
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
