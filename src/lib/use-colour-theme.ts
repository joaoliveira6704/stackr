import { watch } from "vue";
import { useProgressStore } from "../stores/progress";
import type { ColourThemeId } from "./shop";

const COLOUR_THEME_ATTRIBUTE = "data-colour-theme";

export function applyColourTheme(theme: ColourThemeId | null): void {
	const root = document.documentElement;
	if (theme) root.setAttribute(COLOUR_THEME_ATTRIBUTE, theme);
	else root.removeAttribute(COLOUR_THEME_ATTRIBUTE);
}

/**
 * Puts the colour theme the user bought in the shop on the whole page. The
 * progress store resets on sign out, so public pages fall back to the default
 * look by themselves. Called once, in App.vue.
 */
export function useColourTheme(): void {
	const progress = useProgressStore();
	watch(() => progress.equipped.colourTheme, applyColourTheme, {
		immediate: true,
	});
}
