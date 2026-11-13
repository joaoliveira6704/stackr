import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getInitialTheme, saveTheme } from "./theme";

function fakeSystemTheme(prefersDark: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({ matches: prefersDark })),
	);
}

afterEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove("dark");
	vi.unstubAllGlobals();
});

describe("getInitialTheme", () => {
	it("follows a dark system setting when the user never chose", () => {
		fakeSystemTheme(true);

		expect(getInitialTheme()).toBe("dark");
	});

	it("follows a light system setting when the user never chose", () => {
		fakeSystemTheme(false);

		expect(getInitialTheme()).toBe("light");
	});

	it("prefers the theme the user picked over the system setting", () => {
		fakeSystemTheme(true);
		localStorage.setItem("stackr.theme", "light");

		expect(getInitialTheme()).toBe("light");
	});

	it("ignores a saved value that is not a theme", () => {
		fakeSystemTheme(false);
		localStorage.setItem("stackr.theme", "purple");

		expect(getInitialTheme()).toBe("light");
	});

	it("falls back to light when the browser cannot tell", () => {
		vi.stubGlobal("matchMedia", undefined);

		expect(getInitialTheme()).toBe("light");
	});
});

describe("applyTheme and saveTheme", () => {
	it("adds the dark class for the dark theme and removes it for light", () => {
		applyTheme("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		applyTheme("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("remembers the chosen theme and applies it", () => {
		saveTheme("dark");

		expect(localStorage.getItem("stackr.theme")).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
});
