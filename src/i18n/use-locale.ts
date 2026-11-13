import { useI18n } from "vue-i18n";
import { LOCALES, type Locale, saveLocale } from "./index";

export function useLocale() {
	const { locale } = useI18n();

	function setLocale(next: Locale) {
		locale.value = next;
		saveLocale(next);
	}

	// With two languages, "the other one" is all a single toggle needs.
	function toggleLocale() {
		setLocale(LOCALES.find((option) => option !== locale.value) ?? LOCALES[0]);
	}

	return { locale, setLocale, toggleLocale };
}
