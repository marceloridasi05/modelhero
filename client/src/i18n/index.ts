import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './locales/pt.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', name: 'Português', short: 'PT' },
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'es', name: 'Español', short: 'ES' },
  { code: 'fr', name: 'Français', short: 'FR' },
  { code: 'de', name: 'Deutsch', short: 'DE' },
  { code: 'it', name: 'Italiano', short: 'IT' },
  { code: 'ru', name: 'Русский', short: 'RU' },
  { code: 'ja', name: '日本語', short: 'JA' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  ru: { translation: ru },
  ja: { translation: ja },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'modelhero-language',
    },
  });

export function setLanguageImmediate(lang: LanguageCode) {
  i18n.changeLanguage(lang);
  localStorage.setItem('modelhero-language', lang);
}

export default i18n;
