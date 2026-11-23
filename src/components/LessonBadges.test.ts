import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { describe, expect, it } from "vitest";
import { createAppI18n, type Locale } from "../i18n";
import type { BadgeScreen } from "../lib/badges";
import { useProgressStore } from "../stores/progress";
import LessonBadges from "./LessonBadges.vue";

function mountBadges(
	screen: BadgeScreen,
	earned: string[] = [],
	locale: Locale = "en",
) {
	const pinia = createPinia();
	setActivePinia(pinia);
	for (const id of earned) useProgressStore().unlockBadge(id);
	return mount(LessonBadges, {
		props: { screen },
		global: { plugins: [pinia, createAppI18n(locale)] },
	});
}

describe("LessonBadges", () => {
	it("lists the lessons behind the screen with what earns each badge", () => {
		const wrapper = mountBadges("budget");

		expect(wrapper.text()).toContain("What you are applying here");
		expect(wrapper.text()).toContain("50/30/20 Rule");
		expect(wrapper.text()).toContain("Lesson on splitting your salary");
		expect(wrapper.text()).toContain("0 of 3");
	});

	it("keeps badges the user has not earned locked", () => {
		const wrapper = mountBadges("simulator");

		expect(wrapper.findAll("li[data-locked]")).toHaveLength(4);
	});

	it("shows an earned badge as earned and counts it", () => {
		const wrapper = mountBadges("simulator", ["inflation"]);

		const earned = wrapper.findAll("li:not([data-locked])");
		expect(earned).toHaveLength(1);
		expect(earned[0].text()).toContain("Inflation");
		expect(earned[0].text()).toContain("Earned");
		expect(wrapper.text()).toContain("1 of 4");
	});

	it("speaks Portuguese by default", () => {
		const wrapper = mountBadges("budget", ["solidFund"], "pt-PT");

		expect(wrapper.text()).toContain("O que estás a aplicar aqui");
		expect(wrapper.text()).toContain("Fundo Sólido");
		expect(wrapper.text()).toContain("Conquistado");
	});
});
