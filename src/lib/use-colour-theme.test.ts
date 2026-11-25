import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { useProgressStore } from "../stores/progress";
import { shopItemId } from "./shop";
import { useColourTheme } from "./use-colour-theme";

const root = document.documentElement;

beforeEach(() => {
	setActivePinia(createPinia());
});

afterEach(() => {
	root.removeAttribute("data-colour-theme");
});

function ownTheme(id: "aurora" | "citrus") {
	const progress = useProgressStore();
	progress.addStacks(100);
	progress.unlockContent(shopItemId("colourTheme", id), 80);
	return progress;
}

describe("useColourTheme", () => {
	it("leaves the page on the default look when no theme is in use", () => {
		useColourTheme();

		expect(root.hasAttribute("data-colour-theme")).toBe(false);
	});

	it("puts the theme the user applied on the whole page", async () => {
		useColourTheme();
		const progress = ownTheme("aurora");

		progress.equip("colourTheme", "aurora");
		await nextTick();

		expect(root.getAttribute("data-colour-theme")).toBe("aurora");
	});

	it("removes the theme when the user goes back to the default", async () => {
		useColourTheme();
		const progress = ownTheme("citrus");
		progress.equip("colourTheme", "citrus");
		await nextTick();

		progress.equip("colourTheme", null);
		await nextTick();

		expect(root.hasAttribute("data-colour-theme")).toBe(false);
	});

	it("removes the theme on sign out, when the progress is reset", async () => {
		useColourTheme();
		const progress = ownTheme("citrus");
		progress.equip("colourTheme", "citrus");
		await nextTick();

		progress.reset();
		await nextTick();

		expect(root.hasAttribute("data-colour-theme")).toBe(false);
	});
});
