export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const THEME_KEY = "stackr.theme";

function isTheme(value: unknown): value is Theme {
	return THEMES.includes(value as Theme);
}

function systemPrefersDark(): boolean {
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

// A choice the user made in the app wins over the system setting.
export function getInitialTheme(): Theme {
	const saved = localStorage.getItem(THEME_KEY);
	if (isTheme(saved)) return saved;
	return systemPrefersDark() ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

export function saveTheme(theme: Theme): void {
	localStorage.setItem(THEME_KEY, theme);
	applyTheme(theme);
}
