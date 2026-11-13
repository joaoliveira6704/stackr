import { useI18n } from "vue-i18n";
import type { Locale } from "../i18n";
import type { Localized } from "./types";

// Picks the text for the language the app is showing right now.
export function useLocalized() {
	const { locale } = useI18n();
	return (text: Localized): string => text[locale.value as Locale];
}
