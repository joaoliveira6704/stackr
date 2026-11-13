import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AppIcon from "./AppIcon.vue";
import { ICONS, TRACK_ICONS } from "./icons";

describe("AppIcon", () => {
	it("draws the Lucide icon for the given name", () => {
		const wrapper = mount(AppIcon, { props: { name: "flame" } });

		const svg = wrapper.get("svg");
		expect(svg.classes()).toContain("lucide");
		expect(svg.classes()).toContain("lucide-flame-icon");
	});

	it("hides the icon from screen readers, since the text next to it says what it means", () => {
		const wrapper = mount(AppIcon, { props: { name: "user" } });

		expect(wrapper.get("svg").attributes("aria-hidden")).toBe("true");
	});

	it("uses 20 pixels unless a size is given", () => {
		const standard = mount(AppIcon, { props: { name: "sun" } });
		const large = mount(AppIcon, { props: { name: "sun", size: 26 } });

		expect(standard.get("svg").attributes("width")).toBe("20");
		expect(large.get("svg").attributes("width")).toBe("26");
	});

	it("has an icon for every track", () => {
		for (const icon of Object.values(TRACK_ICONS)) {
			expect(ICONS[icon]).toBeDefined();
		}
	});
});
