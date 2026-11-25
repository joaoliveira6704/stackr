import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { type ColourThemeId, shopItemId } from "../lib/shop";
import { useProgressStore } from "../stores/progress";
import AppBackdrop from "./AppBackdrop.vue";

beforeEach(() => {
	setActivePinia(createPinia());
});

function mountBackdrop() {
	return mount(AppBackdrop);
}

async function applyTheme(id: ColourThemeId) {
	const progress = useProgressStore();
	progress.addStacks(500);
	progress.unlockContent(shopItemId("colourTheme", id), 200);
	progress.equip("colourTheme", id);
	await nextTick();
}

function orbColour(classes: string[]): string | undefined {
	return classes.find((name) => /^bg-orb-\d$/.test(name));
}

describe("AppBackdrop", () => {
	it("paints the four theme colours behind the page", () => {
		const colours = mountBackdrop()
			.findAll("[data-orb]")
			.map((light) => orbColour(light.get(".orb").classes()));

		expect(colours).toEqual(["bg-orb-1", "bg-orb-2", "bg-orb-3", "bg-orb-4"]);
	});

	it("fades each light into the colour of the next one, so it never leaves the theme", () => {
		const nextColours = mountBackdrop()
			.findAll("[data-orb-next]")
			.map((light) => orbColour(light.classes()));

		expect(nextColours).toEqual([
			"bg-orb-2",
			"bg-orb-3",
			"bg-orb-4",
			"bg-orb-1",
		]);
	});

	it("starts every light at a different point, so they never move in step", () => {
		const delays = mountBackdrop()
			.findAll("[data-orb]")
			.map((light) =>
				light.classes().find((name) => name.startsWith("[animation-delay")),
			);

		expect(new Set(delays).size).toBe(4);
	});

	it("stands still with the free default look", () => {
		expect(mountBackdrop().attributes("data-animated")).toBeUndefined();
	});

	it("stands still with a static theme", async () => {
		const wrapper = mountBackdrop();

		await applyTheme("sunset");

		expect(wrapper.attributes("data-animated")).toBeUndefined();
	});

	it("moves with an animated theme", async () => {
		const wrapper = mountBackdrop();

		await applyTheme("prism");

		expect(wrapper.attributes("data-animated")).toBe("true");
	});

	it("only moves for people who have not asked for less motion", () => {
		for (const light of mountBackdrop().findAll("[data-orb]")) {
			expect(light.classes()).toContain(
				"group-data-animated:motion-safe:animate-orb-drift",
			);
			expect(light.get("[data-orb-next]").classes()).toEqual(
				expect.arrayContaining([
					"hidden",
					"group-data-animated:motion-safe:block",
				]),
			);
		}
	});

	it("is hidden from screen readers", () => {
		expect(mountBackdrop().attributes("aria-hidden")).toBe("true");
	});
});
