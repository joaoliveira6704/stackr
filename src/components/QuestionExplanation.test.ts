import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAppI18n, type Locale } from "../i18n";
import QuestionExplanation from "./QuestionExplanation.vue";

const TEXT = "Inflation measures how fast prices go up over time.";

function mountExplanation(locale: Locale = "en") {
	return mount(QuestionExplanation, {
		props: { text: TEXT },
		global: { plugins: [createAppI18n(locale)] },
	});
}

describe("QuestionExplanation", () => {
	it("starts blurred and hidden from screen readers", () => {
		const wrapper = mountExplanation();

		expect(wrapper.attributes("data-revealed")).toBeUndefined();
		expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
		expect(wrapper.get("p").attributes("aria-hidden")).toBe("true");
	});

	it("links the button to the text it reveals", () => {
		const wrapper = mountExplanation();

		const textId = wrapper.get("p").attributes("id");
		expect(textId).toBeTruthy();
		expect(wrapper.get("button").attributes("aria-controls")).toBe(textId);
	});

	it("reveals the explanation when the card is pressed", async () => {
		const wrapper = mountExplanation();

		await wrapper.get("button").trigger("click");

		expect(wrapper.attributes("data-revealed")).toBe("true");
		expect(wrapper.get("button").attributes("aria-expanded")).toBe("true");
		expect(wrapper.get("p").attributes("aria-hidden")).toBe("false");
		expect(wrapper.get("p").text()).toBe(TEXT);
	});

	it("blurs the explanation again when pressed a second time", async () => {
		const wrapper = mountExplanation();

		await wrapper.get("button").trigger("click");
		await wrapper.get("button").trigger("click");

		expect(wrapper.attributes("data-revealed")).toBeUndefined();
		expect(wrapper.get("button").attributes("aria-expanded")).toBe("false");
	});

	it("swaps the hint once the explanation is visible", async () => {
		const wrapper = mountExplanation();
		expect(wrapper.text()).toContain("For when you want to know more");

		await wrapper.get("button").trigger("click");

		expect(wrapper.text()).toContain("Press again to hide it");
	});

	it("speaks Portuguese when the app is in Portuguese", () => {
		const wrapper = mountExplanation("pt-PT");

		expect(wrapper.text()).toContain("Explicação detalhada");
		expect(wrapper.text()).toContain("Ver explicação");
	});
});
