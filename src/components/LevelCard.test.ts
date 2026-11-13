import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAppI18n, type Locale } from "../i18n";
import LevelCard from "./LevelCard.vue";

function mountLevelCard(xp: number, locale: Locale = "en") {
	return mount(LevelCard, {
		props: { xp },
		global: { plugins: [createAppI18n(locale)] },
	});
}

describe("LevelCard", () => {
	it("shows the level and the XP left to the next one", () => {
		const wrapper = mountLevelCard(440);

		expect(wrapper.text()).toContain("Level 2");
		expect(wrapper.text()).toContain("Apprentice");
		expect(wrapper.text()).toContain("60 XP to Saver");
	});

	it("starts a new user at zero percent", () => {
		const wrapper = mountLevelCard(0);

		expect(wrapper.text()).toContain("0%");
		expect(wrapper.text()).toContain("200 XP to Apprentice");
	});

	it("says the user reached the top level instead of a next goal", () => {
		const wrapper = mountLevelCard(5000);

		expect(wrapper.text()).toContain("You reached the top level.");
	});

	it("speaks Portuguese when the app is in Portuguese", () => {
		const wrapper = mountLevelCard(0, "pt");

		expect(wrapper.text()).toContain("Iniciante");
		expect(wrapper.text()).toContain("Faltam 200 XP para Aprendiz");
	});
});
