import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";

/** Resources for one locale, keyed by translation namespace. */
export type LocaleNamespaceResources = Record<string, Record<string, unknown>>;

export const SUPPORTED_LOCALES = ["en", "pl"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** English is the canonical source locale (CONTENT-002). */
export const SOURCE_LOCALE: SupportedLocale = "en";

export interface CreateI18nOptions {
  /** locale -> namespace -> key/value resource bundle. */
  readonly resources: Record<SupportedLocale, LocaleNamespaceResources>;
  readonly initialLocale?: SupportedLocale;
}

/**
 * Builds a standalone i18next instance wired to react-i18next.
 *
 * Locale-neutrality invariant (CONTENT-015 / Technology Stack Decision SS60):
 * changing the active locale here must never touch Simulation State. This
 * factory only manages presentation strings -- it has no reference to,
 * and no way to reach, the Simulation Worker.
 */
export function createI18n(options: CreateI18nOptions): i18n {
  const instance = i18next.createInstance();

  void instance.use(initReactI18next).init({
    resources: options.resources,
    lng: options.initialLocale ?? SOURCE_LOCALE,
    fallbackLng: SOURCE_LOCALE,
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return instance;
}
