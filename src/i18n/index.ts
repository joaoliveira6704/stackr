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

// Money is always in euros, whatever the language. Use these through n(),
// such as n(amount, "currency"), so every screen formats money the same way.
const NUMBER_FORMATS = {
	currency: { style: "currency", currency: "EUR" },
	compactCurrency: {
		style: "currency",
		currency: "EUR",
		notation: "compact",
		maximumFractionDigits: 1,
	},
	percent: { style: "percent", maximumFractionDigits: 1 },
	signedCurrency: {
		style: "currency",
		currency: "EUR",
		signDisplay: "exceptZero",
	},
	shares: { maximumFractionDigits: 8 },
	ratePercent: {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	},
	signedPercent: {
		style: "percent",
		maximumFractionDigits: 1,
		signDisplay: "exceptZero",
	},
} as const;

export type NumberFormatKey = keyof typeof NUMBER_FORMATS;

// Dates go through d(), such as d(date, "dayMonth"), so they follow the language.
const DATETIME_FORMATS = {
	dayMonth: { day: "numeric", month: "short" },
	dayMonthYear: { day: "numeric", month: "short", year: "numeric" },
	dayMonthTime: {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	},
} as const;

export function createAppI18n(locale: Locale = getSavedLocale()) {
	document.documentElement.lang = locale;
	return createI18n<[MessageSchema], Locale, false>({
		legacy: false,
		locale,
		fallbackLocale: DEFAULT_LOCALE,
		messages: { "pt-PT": pt, en },
		numberFormats: { "pt-PT": NUMBER_FORMATS, en: NUMBER_FORMATS },
		datetimeFormats: { "pt-PT": DATETIME_FORMATS, en: DATETIME_FORMATS },
	});
}
