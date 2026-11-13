import { createI18n } from "vue-i18n";
import { en } from "./en";
import { type MessageSchema, pt } from "./pt";

export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";
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

export function createAppI18n(locale: Locale = getSavedLocale()) {
	document.documentElement.lang = locale;
	return createI18n<[MessageSchema], Locale, false>({
		legacy: false,
		locale,
		fallbackLocale: DEFAULT_LOCALE,
		messages: { pt, en },
	});
}
