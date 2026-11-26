import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { PaletteColour } from "../lib/shop";
import ThemePreview from "./ThemePreview.vue";

const SUNSET: PaletteColour[] = ["tangerine", "sun", "tangerine", "grape"];

function mountPreview(animated = false) {
	return mount(ThemePreview, { props: { orbs: SUNSET, animated } });
}

function colourOf(classes: string[]) {
	return classes.find((name) => name.startsWith("bg-"));
}

describe("ThemePreview", () => {
	it("glows with the theme's own colours, in the order of the real backdrop", () => {
		const colours = mountPreview()
			.findAll("[data-sample-orb]")
			.map((light) => colourOf(light.get(".orb").classes()));

		expect(colours).toEqual([
			"bg-tangerine",
			"bg-sun",
			"bg-tangerine",
			"bg-grape",
		]);
	});

	it("shows a sample of the app with the green main button on top", () => {
		const wrapper = mountPreview();

		expect(wrapper.findAll(".glass")).toHaveLength(2);
		expect(wrapper.find(".bg-brand").exists()).toBe(true);
	});

	it("stands still for a static theme", () => {
		expect(mountPreview(false).attributes("data-animated")).toBeUndefined();
	});

	it("moves for an animated theme, only for people who have not asked for less motion", () => {
		const wrapper = mountPreview(true);

		expect(wrapper.attributes("data-animated")).toBe("true");
		for (const light of wrapper.findAll("[data-sample-orb]")) {
			expect(light.classes()).toContain(
				"group-data-animated:motion-safe:animate-orb-drift-sm",
			);
		}
	});

	it("grows taller when asked for the large window", () => {
		const large = mount(ThemePreview, {
			props: { orbs: SUNSET, animated: false, large: true },
		});

		expect(large.attributes("data-large")).toBe("true");
		expect(mountPreview().attributes("data-large")).toBeUndefined();
	});

	it("is hidden from screen readers", () => {
		expect(mountPreview().attributes("aria-hidden")).toBe("true");
	});
});
