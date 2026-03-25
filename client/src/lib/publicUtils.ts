const LANG_TO_ROUTE: Record<string, string> = {
  pt: "",
  en: "/en",
  es: "/es",
  fr: "/fr",
  de: "/ge",
  it: "/it",
  ru: "/ru",
  ja: "/jp",
};

export function getRegisterPath(lang: string): string {
  const prefix = LANG_TO_ROUTE[lang] ?? "";
  return `${prefix}/register`;
}

const LANG_TO_HOME_URL: Record<string, string> = {
  pt: "https://modelhero.app",
  en: "https://modelhero.app/home_en/",
  es: "https://modelhero.app/home_es",
};

export function getModelHeroHomeUrl(lang: string): string {
  return LANG_TO_HOME_URL[lang] ?? "https://modelhero.app/home_en/";
}
