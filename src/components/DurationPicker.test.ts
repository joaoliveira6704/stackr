import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAppI18n } from "../i18n";
import DurationPicker from "./DurationPicker.vue";

function mountPicker(years: number, locale: "en" | "pt-PT" = "en") {
	return mount(DurationPicker, {
		props: { modelValue: years },
		global: { plugins: [createAppI18n(locale)] },
	});
}

function presets(wrapper: ReturnType<typeof mountPicker>) {
	return wrapper.findAll("button");
}

describe("DurationPicker", () => {
	it("offers 5, 10, 20 and 30 years in one click", () => {
		const wrapper = mountPicker(20);

		expect(presets(wrapper).map((button) => button.text())).toEqual([
			"5 years",
			"10 years",
			"20 years",
			"30 years",
		]);
	});

	it("marks the preset that matches the chosen period", () => {
		const wrapper = mountPicker(10);

		const pressed = presets(wrapper).map((button) =>
			button.attributes("aria-pressed"),
		);
		expect(pressed).toEqual(["false", "true", "false", "false"]);
	});

	it("marks no preset for a period in between", () => {
		const wrapper = mountPicker(17);

		expect(
			presets(wrapper).every(
				(button) => button.attributes("aria-pressed") === "false",
			),
		).toBe(true);
		expect(wrapper.text()).toContain("17 years");
	});

	it("chooses a preset when it is pressed", async () => {
		const wrapper = mountPicker(20);

		await presets(wrapper)[0].trigger("click");

		expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([5]);
	});

	it("lets the slider pick any period from 1 to 50 years", async () => {
		const wrapper = mountPicker(20);
		const slider = wrapper.get<HTMLInputElement>('input[type="range"]');

		expect(slider.attributes("min")).toBe("1");
		expect(slider.attributes("max")).toBe("50");

		slider.element.value = "42";
		await slider.trigger("input");

		expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([42]);
	});

	it("reads the period out with its unit", () => {
		const wrapper = mountPicker(12);

		expect(
			wrapper.get('input[type="range"]').attributes("aria-valuetext"),
		).toBe("12 years");
	});

	it("says year, not years, for a single year", () => {
		const wrapper = mountPicker(1);

		expect(wrapper.text()).toContain("1 year");
		expect(wrapper.text()).not.toContain("1 years");
	});

	it("speaks Portuguese", () => {
		const wrapper = mountPicker(1, "pt-PT");

		expect(wrapper.text()).toContain("Durante quanto tempo?");
		expect(wrapper.text()).toContain("1 ano");
		expect(wrapper.text()).toContain("20 anos");
	});
});
