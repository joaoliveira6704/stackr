import { readonly, ref } from "vue";
import { applyTheme, getInitialTheme, saveTheme, type Theme } from "./theme";

// Kept at module level so every component sees the same theme.
const currentTheme = ref<Theme>(getInitialTheme());
applyTheme(currentTheme.value);

function setTheme(theme: Theme): void {
	currentTheme.value = theme;
	saveTheme(theme);
}

function toggleTheme(): void {
	setTheme(currentTheme.value === "dark" ? "light" : "dark");
}

export function useTheme() {
	return { theme: readonly(currentTheme), setTheme, toggleTheme };
}
