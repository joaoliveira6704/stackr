import { createI18n } from "vue-i18n";
import { en } from "./en";
import { type MessageSchema, pt } from "./pt";

// "pt-PT" rather than "pt", because the browser reads a bare "pt" as
// Brazilian Portuguese and would format 1250 as "1.250" instead of "1250".
export const LOCALES = ["pt-PT", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-PT";
const LOCALE_KEY = "stackr.locale";

function isLocale(value: unknown): value is Locale {
	return LOCALES.includes(value as Locale);
}

export function getSavedLocale(): Locale {
	const saved = localStorage.getItem(LOCALE_KEY);
	return isLocale(saved) ? saved : DEFAULT_LOCALE;
}

export function saveLocale(locale: Locale): void {
	localStorage.setItem(LOCALE_KEY, locale);
	document.documentElement.lang = locale;
}

/** The two letters shown on the language switcher, such as "pt". */
export function localeShortName(locale: Locale): string {
	return locale.slice(0, 2);
}

export function createAppI18n(locale: Locale = getSavedLocale()) {
	document.documentElement.lang = locale;
	return createI18n<[MessageSchema], Locale, false>({
		legacy: false,
		locale,
		fallbackLocale: DEFAULT_LOCALE,
		messages: { "pt-PT": pt, en },
	});
}
